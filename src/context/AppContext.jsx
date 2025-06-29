import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTimer } from '../hooks/useTimer';
import { useDocument } from '../hooks/useFirestore';
import { settingsRef, updateSettings as updateSettingsService } from '../services/firebase';
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

    // This factory function now correctly waits for userId before creating the ref
    const settingsRefFactory = useCallback(() => userId ? settingsRef(userId) : null, [userId]);
    const { data: settingsData, error: settingsError } = useDocument(settingsRefFactory);

    const settings = settingsData || defaultSettings;
    const timer = useTimer(settings);

    // This effect now correctly creates the default settings for the specific user
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
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}