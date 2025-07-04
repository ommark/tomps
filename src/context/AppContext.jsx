import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'; // 1. Import useRef
import { useAuth } from '../hooks/useAuth';
import { useTimer } from '../hooks/useTimer';
import { useDocument, useCollection } from '../hooks/useFirestore';
import { settingsRef, updateSettings as updateSettingsService, predefinedActivitiesRef, activitiesRef, addActivity } from '../services/firebase';
import {
    DEFAULT_WORK_DURATION_MINUTES, DEFAULT_SHORT_BREAK_DURATION_MINUTES, DEFAULT_LONG_BREAK_DURATION_MINUTES,
    DEFAULT_POMODOROS_BEFORE_LONG_BREAK, SECONDS_IN_MINUTE
} from '../constants';

const AppContext = createContext();
export const useAppContext = () => useContext(AppContext);

const defaultSettings = {
    workDuration: DEFAULT_WORK_DURATION_MINUTES * SECONDS_IN_MINUTE,
    shortBreakDuration: DEFAULT_SHORT_BREAK_DURATION_MINUTES * SECONDS_IN_MINUTE,
    longBreakDuration: DEFAULT_LONG_BREAK_DURATION_MINUTES * SECONDS_IN_MINUTE,
    pomodorosBeforeLongBreak: DEFAULT_POMODOROS_BEFORE_LONG_BREAK,
    soundEnabled: true,
    starterPackAdded: false,
};

export function AppProvider({ children }) {
    const { user, userId, isAuthReady } = useAuth();
    const [toastMessage, setToastMessage] = useState(null);
    const [showBreakModal, setShowBreakModal] = useState(false);
    const [suggestedActivity, setSuggestedActivity] = useState(null);
    const isSeeding = useRef(false); // 2. Create the lock using useRef

    const settingsRefFactory = useCallback(() => userId ? settingsRef(userId) : null, [userId]);
    const { data: settingsData, error: settingsError } = useDocument(settingsRefFactory);

    const userActivitiesRefFactory = useCallback(() => userId ? activitiesRef(userId) : null, [userId]);
    const { data: userActivities } = useCollection(userActivitiesRefFactory);

    const { data: predefinedActivities } = useCollection(predefinedActivitiesRef, null);

    const settings = settingsData || defaultSettings;

    // ... (rest of the functions are the same)
    const pickNewSuggestedActivity = useCallback(() => {
        const activeUserActivities = userActivities?.filter(act => act.active);
        if (activeUserActivities && activeUserActivities.length > 0) {
            const randomIndex = Math.floor(Math.random() * activeUserActivities.length);
            setSuggestedActivity(activeUserActivities[randomIndex]);
        } else {
            setSuggestedActivity({ name: 'Relax or add activities in Settings!', category: 'Well-being' });
        }
    }, [userActivities]);

    const triggerBreak = useCallback(() => {
        pickNewSuggestedActivity();
        setShowBreakModal(true);
    }, [pickNewSuggestedActivity]);

    const timer = useTimer(settings, triggerBreak);

    const startBreak = () => {
        setShowBreakModal(false);
        timer.start();
    };

    useEffect(() => {
        if (isAuthReady && userId && !settingsData && !settingsError) {
            updateSettingsService(userId, defaultSettings).catch(e => console.error("Failed to create default settings", e));
        }
    }, [isAuthReady, userId, settingsData, settingsError]);

    // --- CORRECTED: Onboarding Effect with Lock ---
    useEffect(() => {
        // 3. Add a check for the lock: `!isSeeding.current`
        if (userId && settingsData && !settingsData.starterPackAdded && predefinedActivities?.length > 0 && !isSeeding.current) {
            // Immediately engage the lock to prevent re-entry
            isSeeding.current = true;
            console.log("Adding starter pack for new user...");

            const starterActivities = predefinedActivities.slice(0, 3);

            const addStarterPack = async () => {
                try {
                    for (const activity of starterActivities) {
                        await addActivity(userId, activity.name, activity.category);
                    }
                    await updateSettingsService(userId, { starterPackAdded: true });
                } catch (e) {
                    console.error("Failed to add starter pack", e);
                }
            };

            addStarterPack();
        }
    }, [userId, settingsData, predefinedActivities]);

    const showToast = (message, type = 'info') => {
        setToastMessage({ message, type });
        setTimeout(() => setToastMessage(null), 3000);
    };

    const value = {
        isAuthReady, userId, settings, toastMessage, showToast, ...timer,
        showBreakModal, suggestedActivity, triggerBreak, startBreak, pickNewSuggestedActivity,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}