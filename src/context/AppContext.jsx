import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTimer } from '../hooks/useTimer';
import { useDocument, useCollection } from '../hooks/useFirestore';
// CORRECTED: Added predefinedActivitiesRef to the import list
import { settingsRef, activitiesRef, initializeNewUser, predefinedActivitiesRef } from '../services/firebase';
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
    const { userId, isAuthReady } = useAuth();
    const [toastMessage, setToastMessage] = useState(null);
    const [showBreakModal, setShowBreakModal] = useState(false);
    const [suggestedActivity, setSuggestedActivity] = useState(null);
    const hasInitialized = useRef(false);

    const settingsRefFactory = useCallback(() => userId ? settingsRef(userId) : null, [userId]);
    const { data: settingsData, error: settingsError } = useDocument(settingsRefFactory);

    const userActivitiesRefFactory = useCallback(() => userId ? activitiesRef(userId) : null, [userId]);
    const { data: userActivities } = useCollection(userActivitiesRefFactory);

    // This line will now work because predefinedActivitiesRef is imported correctly.
    const { data: predefinedActivities } = useCollection(predefinedActivitiesRef, null);

    const settings = settingsData || defaultSettings;

    useEffect(() => {
        if (isAuthReady && userId && (settingsData === null || settingsError) && !hasInitialized.current) {
            if (settingsData === null && predefinedActivities?.length > 0) {
                hasInitialized.current = true;
                console.log("Running one-time setup for new user...");

                const starterActivities = predefinedActivities.slice(0, 3);
                initializeNewUser(userId, defaultSettings, starterActivities)
                    .catch(e => console.error("Failed to initialize new user:", e));
            }
        }
    }, [isAuthReady, userId, settingsData, settingsError, predefinedActivities]);

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