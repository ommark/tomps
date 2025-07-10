import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useTimer } from '../hooks/useTimer.js';
import { useDocument, useCollection } from '../hooks/useFirestore.jsx';
import { settingsRef, activitiesRef, initializeNewUser, predefinedActivitiesRef } from '../services/firebase.js';
import {
    DEFAULT_WORK_DURATION_MINUTES, DEFAULT_SHORT_BREAK_DURATION_MINUTES, DEFAULT_LONG_BREAK_DURATION_MINUTES,
    DEFAULT_POMODOROS_BEFORE_LONG_BREAK, SECONDS_IN_MINUTE
} from '../constants.js';

const AppContext = createContext();
export const useAppContext = () => useContext(AppContext);

const defaultSettings = {
    workDuration: DEFAULT_WORK_DURATION_MINUTES * SECONDS_IN_MINUTE,
    shortBreakDuration: DEFAULT_SHORT_BREAK_DURATION_MINUTES * SECONDS_IN_MINUTE,
    longBreakDuration: DEFAULT_LONG_BREAK_DURATION_MINUTES * SECONDS_IN_MINUTE,
    pomodorosBeforeLongBreak: DEFAULT_POMODOROS_BEFORE_LONG_BREAK,
    soundEnabled: true,
};

export function AppProvider({ children }) {
    const { userId, isAuthReady } = useAuth();
    const [toastMessage, setToastMessage] = useState(null);
    const [showBreakModal, setShowBreakModal] = useState(false);
    const [suggestedActivity, setSuggestedActivity] = useState(null);
    const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);
    const initializationLock = useRef(false);

    const settingsRefFactory = useCallback(() => userId ? settingsRef(userId) : null, [userId]);
    // FIX: Consume the new `loading` state from our improved hook.
    const { data: settingsData, error: settingsError, loading: settingsLoading } = useDocument(settingsRefFactory);

    const userActivitiesRefFactory = useCallback(() => userId ? activitiesRef(userId) : null, [userId]);
    const { data: userActivities } = useCollection(userActivitiesRefFactory);

    // FIX: Ensure predefined activities are also handled gracefully while loading.
    const { data: predefinedActivities, error: predefinedActivitiesError } = useCollection(predefinedActivitiesRef, null);

    const settings = settingsData || defaultSettings;

    // FIX: This effect now waits for settings to be fully loaded before checking for a new user.
    useEffect(() => {
        // Wait until auth is ready, settings have been fetched, and predefined activities are loaded.
        if (settingsLoading || !isAuthReady || !userId || !predefinedActivities) {
            return;
        }

        // This check is now reliable and will not run prematurely.
        const isNewUser = settingsData === null;

        if (isNewUser && !settingsError && !predefinedActivitiesError) {
            if (initializationLock.current) return;
            initializationLock.current = true;

            console.log("Running one-time setup for new user...");
            setShowWelcomeScreen(true);

            // This also ensures predefinedActivities is not null before slicing.
            const starterActivities = predefinedActivities.slice(0, 3);
            initializeNewUser(userId, defaultSettings, starterActivities)
                .catch(e => console.error("Failed to initialize new user:", e));
        }
    }, [isAuthReady, userId, settingsData, settingsError, settingsLoading, predefinedActivities, predefinedActivitiesError]);

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

    const dismissWelcomeScreen = () => {
        setShowWelcomeScreen(false);
    };

    const value = {
        isAuthReady, userId, settings, toastMessage, showToast, ...timer,
        showBreakModal, suggestedActivity, triggerBreak, startBreak, pickNewSuggestedActivity,
        showWelcomeScreen, dismissWelcomeScreen,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}