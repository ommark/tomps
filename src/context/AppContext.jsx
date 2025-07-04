import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTimer } from '../hooks/useTimer';
import { useDocument, useCollection } from '../hooks/useFirestore';
import { settingsRef, updateSettings as updateSettingsService, predefinedActivitiesRef } from '../services/firebase';
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
};

export function AppProvider({ children }) {
    const { user, userId, isAuthReady } = useAuth();
    const [toastMessage, setToastMessage] = useState(null);
    const [showBreakModal, setShowBreakModal] = useState(false);
    const [suggestedActivity, setSuggestedActivity] = useState(null);

    const settingsRefFactory = useCallback(() => userId ? settingsRef(userId) : null, [userId]);
    const { data: settingsData, error: settingsError } = useDocument(settingsRefFactory);
    const { data: predefinedActivities } = useCollection(predefinedActivitiesRef, null);

    const settings = settingsData || defaultSettings;

    // --- LOGIC MOVED UP ---
    // All functions are now defined before they are used.

    const pickNewSuggestedActivity = useCallback(() => {
        if (predefinedActivities && predefinedActivities.length > 0) {
            const randomIndex = Math.floor(Math.random() * predefinedActivities.length);
            setSuggestedActivity(predefinedActivities[randomIndex]);
        } else {
            setSuggestedActivity({ name: 'Relax and recharge', category: 'Well-being' });
        }
    }, [predefinedActivities]);

    const triggerBreak = useCallback(() => {
        pickNewSuggestedActivity();
        setShowBreakModal(true);
    }, [pickNewSuggestedActivity]);

    // The 'timer' constant is now defined AFTER triggerBreak exists.
    const timer = useTimer(settings, triggerBreak);

    const startBreak = () => {
        setShowBreakModal(false);
        timer.start();
    };

    // --- END OF MOVED LOGIC ---

    useEffect(() => {
        if (isAuthReady && userId && !settingsData && !settingsError) {
            updateSettingsService(userId, defaultSettings).catch(e => console.error("Failed to create default settings", e));
        }
    }, [isAuthReady, userId, settingsData, settingsError]);

    const showToast = (message, type = 'info') => {
        setToastMessage({ message, type });
        setTimeout(() => setToastMessage(null), 3000);
    };

    const value = {
        isAuthReady,
        userId,
        settings,
        toastMessage,
        showToast,
        ...timer,
        showBreakModal,
        suggestedActivity,
        triggerBreak,
        startBreak,
        pickNewSuggestedActivity,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}