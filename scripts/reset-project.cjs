// This script will delete and completely rebuild the src directory with the final, correct code.
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

const filesToCreate = {
    "main.jsx": `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`,
    "App.jsx": `
import React, { useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import Tabs from './components/shared/Tabs.jsx';
import Toast from './components/shared/Toast.jsx';
import TimerView from './components/Timer/index.jsx';
import SettingsView from './components/Settings/index.jsx';
import StatisticsView from './components/Statistics/index.jsx';
import BreakStartModal from './components/modals/BreakStartModal.jsx';
import WelcomeScreen from './components/WelcomeScreen.jsx';
import FeedbackWidget from './components/FeedbackWidget.jsx';

function AppContent() {
    const { isAuthReady, userId, toastMessage, showWelcomeScreen } = useAppContext();
    const [activeTab, setActiveTab] = useState('timer');

    if (!isAuthReady) {
        return <LoadingSpinner />;
    }

    if (showWelcomeScreen) {
        return <WelcomeScreen />;
    }

    const displayUserId = userId ? \`User ID: \${userId.substring(0, 10)}...\` : 'Authenticating...';

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 font-inter">
            <div className="text-sm text-gray-400 mb-4">{displayUserId}</div>
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className="w-full max-w-lg">
                {activeTab === 'timer' && <TimerView />}
                {activeTab === 'settings' && <SettingsView />}
                {activeTab === 'statistics' && <StatisticsView />}
            </main>
            <Toast message={toastMessage?.message} type={toastMessage?.type} />
            <BreakStartModal />
            <FeedbackWidget />
        </div>
    );
}

export default function App() {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
}
`,
    "constants.js": `
export const SECONDS_IN_MINUTE = 60;
export const DEFAULT_WORK_DURATION_MINUTES = 25;
export const DEFAULT_SHORT_BREAK_DURATION_MINUTES = 5;
export const DEFAULT_LONG_BREAK_DURATION_MINUTES = 15;
export const DEFAULT_POMODOROS_BEFORE_LONG_BREAK = 4;
export const PHASES = {
    POMODORO: 'pomodoro',
    SHORT_BREAK: 'shortBreak',
    LONG_BREAK: 'longBreak',
};
`,
    "utils/formatTime.js": `
import { SECONDS_IN_MINUTE } from '../constants.js';

export const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / SECONDS_IN_MINUTE);
    const remainingSeconds = Math.floor(seconds % SECONDS_IN_MINUTE);

    return \`\${String(minutes).padStart(2, '0')}:\${String(remainingSeconds).padStart(2, '0')}\`;
};
`,
    "index.css": `
@tailwind base;
@tailwind components;
@tailwind utilities;
`,
    "services/firebase.js": `
import { initializeApp } from 'firebase/app';
import { initializeAuth, indexedDBLocalPersistence } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
    persistence: indexedDBLocalPersistence
});
export const db = getFirestore(app);

const getDocPath = (userId, collectionName, docId) => \`users/\${userId}/\${collectionName}/\${docId}\`;
const getCollectionPath = (userId, collectionName) => \`users/\${userId}/\${collectionName}\`;

export const settingsRef = (userId) => doc(db, getDocPath(userId, 'settings', 'userSettings'));
export const updateSettings = (userId, data) => setDoc(settingsRef(userId), data, { merge: true });

export const activitiesRef = (userId) => collection(db, getCollectionPath(userId, 'activities'));
export const addActivity = (userId, name, category) => addDoc(activitiesRef(userId), { name, category: category || 'General', active: true, isCustom: true, timestamp: serverTimestamp() });
export const updateActivity = (userId, id, data) => updateDoc(doc(db, getCollectionPath(userId, 'activities'), id), data);
export const deleteActivity = (userId, id) => deleteDoc(doc(db, getCollectionPath(userId, 'activities'), id));

export const predefinedActivitiesRef = () => collection(db, 'predefined_activities');

export const pomodoroTasksRef = (userId) => collection(db, getCollectionPath(userId, 'pomodoroTasks'));
export const addPomodoroTask = (userId, task, pomodoroCount, durationSeconds) => addDoc(pomodoroTasksRef(userId), { task, pomodoroCountAtCompletion: pomodoroCount, durationSeconds, timestamp: serverTimestamp() });

export const breakActivitiesRef = (userId) => collection(db, getCollectionPath(userId, 'breakActivitiesCompleted'));
export const addBreakActivity = (userId, activity) => addDoc(breakActivitiesRef(userId), { activity, timestamp: serverTimestamp() });

export const addFeedback = (userId, feedbackText) => {
    const feedbackCollection = collection(db, 'feedback');
    return addDoc(feedbackCollection, {
        userId: userId,
        feedback: feedbackText,
        createdAt: serverTimestamp(),
        appVersion: '1.0-mvp'
    });
};

export const initializeNewUser = async (userId, defaultSettings, starterActivities) => {
    const batch = writeBatch(db);
    const userSettingsRef = settingsRef(userId);
    batch.set(userSettingsRef, { ...defaultSettings, starterPackAdded: true });
    const userActivitiesRef = activitiesRef(userId);
    for (const activity of starterActivities) {
        const newActivityRef = doc(userActivitiesRef);
        batch.set(newActivityRef, { 
            name: activity.name, 
            category: activity.category, 
            active: true, 
            isCustom: false, 
            timestamp: serverTimestamp() 
        });
    }
    await batch.commit();
};
`,
    "hooks/useAuth.jsx": `
import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from '../services/firebase';

export function useAuth() {
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user);
            } else {
                try {
                    await signInAnonymously(auth);
                } catch (error) {
                    console.error("Firebase Anonymous Sign-in error:", error);
                }
            }
            setIsAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    return { user, userId: user?.uid, isAuthReady };
}
`,
    "hooks/useFirestore.jsx": `
import { useState, useEffect, useMemo } from 'react';
import { onSnapshot, query, orderBy } from 'firebase/firestore';

export function useCollection(refFactory, orderByField = 'timestamp', orderByDirection = 'desc') {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const ref = useMemo(() => refFactory ? refFactory() : null, [refFactory]);

    useEffect(() => {
        if (!ref) {
            setData([]);
            return;
        }
        
        let q = ref;
        if (orderByField) {
            q = query(ref, orderBy(orderByField, orderByDirection));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setData(fetchedData);
            setError(null);
        }, (err) => {
            console.error(err);
            setError('Failed to load data.');
        });

        return () => unsubscribe();
    }, [ref, orderByField, orderByDirection]);

    return { data, error };
}

export function useDocument(refFactory) {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const ref = useMemo(() => refFactory ? refFactory() : null, [refFactory]);

    useEffect(() => {
        if (!ref) {
            setData(null);
            return;
        }
        
        const unsubscribe = onSnapshot(ref, (doc) => {
            if (doc.exists()) {
                setData({ id: doc.id, ...doc.data() });
                setError(null);
            } else {
                setData(null); 
            }
        }, (err) => {
            console.error(err);
            setError('Failed to load document.');
        });
        return () => unsubscribe();
    }, [ref]);

    return { data, error };
}
`,
    "hooks/useTimer.js": `
import { useState, useEffect, useRef, useCallback } from 'react';
import { PHASES } from '../constants';

const workEndSound = new Audio('https://www.soundjay.com/buttons/beep-07.mp3');
const breakEndSound = new Audio('https://www.soundjay.com/buttons/beep-09.mp3');

export function useTimer(settings, onPomodoroComplete) {
    const [currentPhase, setCurrentPhase] = useState(PHASES.POMODORO);
    const [timeLeft, setTimeLeft] = useState(settings.workDuration);
    const [isRunning, setIsRunning] = useState(false);
    const [pomodoroCount, setPomodoroCount] = useState(0);
    const timerRef = useRef(null);

    useEffect(() => {
        if (!isRunning) {
            setTimeLeft(settings.workDuration);
            setCurrentPhase(PHASES.POMODORO);
            setPomodoroCount(0);
        }
    }, [settings.workDuration]);

    const showNotification = useCallback((title, body, sound) => {
        if (settings.soundEnabled) {
            sound.play().catch(e => console.warn("Failed to play sound:", e));
        }
        if (!("Notification" in window) || Notification.permission !== "granted") return;
        new Notification(title, { body });
    }, [settings.soundEnabled]);

    const handlePhaseEnd = useCallback(() => {
        let nextPhase, nextTime, newPomodoroCount = pomodoroCount;

        if (currentPhase === PHASES.POMODORO) {
            newPomodoroCount++;
            setPomodoroCount(newPomodoroCount);
            
            if (newPomodoroCount > 0 && newPomodoroCount % settings.pomodorosBeforeLongBreak === 0) {
                nextPhase = PHASES.LONG_BREAK;
                nextTime = settings.longBreakDuration;
            } else {
                nextPhase = PHASES.SHORT_BREAK;
                nextTime = settings.shortBreakDuration;
            }
            
            setCurrentPhase(nextPhase);
            setTimeLeft(nextTime);
            setIsRunning(false);
            if (onPomodoroComplete) onPomodoroComplete();
        } else {
            nextPhase = PHASES.POMODORO;
            nextTime = settings.workDuration;
            showNotification('Break Over!', 'Time to get back to work!', workEndSound);
            setCurrentPhase(nextPhase);
            setTimeLeft(nextTime);
            setIsRunning(true);
        }
    }, [currentPhase, pomodoroCount, settings, showNotification, onPomodoroComplete]);

    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && isRunning) {
            handlePhaseEnd();
        }
        return () => clearInterval(timerRef.current);
    }, [isRunning, timeLeft, handlePhaseEnd]);

    const start = useCallback(() => setIsRunning(true), []);
    const pause = useCallback(() => setIsRunning(false), []);
    const reset = useCallback(() => {
        setIsRunning(false);
        setCurrentPhase(PHASES.POMODORO);
        setTimeLeft(settings.workDuration);
        setPomodoroCount(0);
    }, [settings.workDuration]);
    const skip = useCallback(() => {
        setIsRunning(false);
        handlePhaseEnd();
    }, [handlePhaseEnd]);

    const totalDuration = settings[{
        [PHASES.POMODORO]: 'workDuration',
        [PHASES.SHORT_BREAK]: 'shortBreakDuration',
        [PHASES.LONG_BREAK]: 'longBreakDuration',
    }[currentPhase]] || settings.workDuration;

    return { timeLeft, phase: currentPhase, isRunning, pomodoroCount, totalDuration, start, pause, reset, skip };
}
`,
    "context/AppContext.jsx": `
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
    const { data: settingsData, error: settingsError } = useDocument(settingsRefFactory);
    
    const userActivitiesRefFactory = useCallback(() => userId ? activitiesRef(userId) : null, [userId]);
    const { data: userActivities } = useCollection(userActivitiesRefFactory);
    
    const { data: predefinedActivities } = useCollection(predefinedActivitiesRef, null);

    const settings = settingsData || defaultSettings;

    useEffect(() => {
        const isNewUser = settingsData === null;
        const canInitialize = isAuthReady && userId && isNewUser && !settingsError && predefinedActivities;

        if (canInitialize && !initializationLock.current) {
            initializationLock.current = true;
            console.log("Running one-time setup for new user...");
            
            setShowWelcomeScreen(true);
            
            const starterActivities = predefinedActivities.slice(0, 3);
            initializeNewUser(userId, defaultSettings, starterActivities)
                .catch(e => console.error("Failed to initialize new user:", e));
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
`,
    "components/LoadingSpinner.jsx": `
import React from 'react';

export default function LoadingSpinner() {
    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 font-inter">
            <div className="text-xl font-bold text-blue-300 animate-pulse">Loading Application...</div>
            <p className="text-gray-400 mt-2">Please wait while we set things up.</p>
        </div>
    );
}
`,
    "components/WelcomeScreen.jsx": `
import React from 'react';
import { useAppContext } from '../context/AppContext.jsx';

export default function WelcomeScreen() {
    const { dismissWelcomeScreen } = useAppContext();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-lg text-left">
                <h1 className="text-3xl font-bold text-purple-300 mb-4">🍅 Welcome to tomps!</h1>
                <p className="text-lg text-gray-300 mb-6">Here’s how to get started on your first productive session.</p>
                <ol className="list-decimal list-inside space-y-4 text-gray-200">
                    <li><span className="font-bold">Start the Timer:</span> The timer is set for a 25-minute focused work session.</li>
                    <li><span className="font-bold">Take an Intentional Break:</span> When the timer finishes, a modal will pop up with a suggested activity.</li>
                    <li><span className="font-bold">Begin Your Break:</span> Click "Start Break" to begin your break timer and complete the activity.</li>
                    <li><span className="font-bold">Repeat & Customize:</span> Go to the **Settings** tab to customize your timers and activities.</li>
                </ol>
                <div className="mt-8 text-center">
                    <button
                        onClick={dismissWelcomeScreen}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-10 rounded-lg text-xl"
                    >
                        Get Started
                    </button>
                </div>
            </div>
        </div>
    );
}
`,
    "components/FeedbackWidget.jsx": `
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext.jsx';
import { addFeedback } from '../services/firebase.js';

export default function FeedbackWidget() {
    const { userId, showToast } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!feedbackText.trim() || !userId) return;

        setIsSubmitting(true);
        try {
            await addFeedback(userId, feedbackText);
            showToast('Thank you for your feedback!', 'success');
            setFeedbackText('');
            setIsOpen(false);
        } catch (error) {
            console.error("Error submitting feedback:", error);
            showToast('Could not send feedback. Please try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-5 right-5 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-5 rounded-full shadow-lg z-40"
                aria-label="Send Feedback"
            >
                Feedback
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
                            aria-label="Close"
                        >
                            &times;
                        </button>
                        <h2 className="text-2xl font-bold text-purple-300 mb-4">Share Your Thoughts</h2>
                        <p className="text-gray-400 mb-6">What's working? What's not? Your feedback helps make tomps better.</p>
                        <form onSubmit={handleSubmit}>
                            <textarea
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                placeholder="Your feedback..."
                                className="w-full h-32 p-3 bg-gray-700 rounded-lg text-white border border-gray-600"
                                required
                            />
                            <div className="mt-6 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg"
                                >
                                    {isSubmitting ? 'Sending...' : 'Send Feedback'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
`,
    "components/shared/Tabs.jsx": `
import React from 'react';

export default function Tabs({ activeTab, setActiveTab }) {
    const tabs = ['timer', 'settings', 'statistics'];
    return (
        <div className="flex bg-gray-800 rounded-full p-1 mb-8 shadow-inner">
            {tabs.map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={\`px-6 py-2 rounded-full text-lg font-semibold transition duration-300 capitalize \${activeTab === tab ? 'bg-purple-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700'}\`}
                >
                    {tab}
                </button>
            ))}
        </div>
    );
}
`,
    "components/shared/Toast.jsx": `
import React from 'react';

export default function Toast({ message, type }) {
    if (!message) return null;

    const baseClasses = 'fixed bottom-4 left-1/2 -translate-x-1/2 p-3 rounded-lg shadow-lg text-white z-50';
    const typeClasses = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-gray-600'
    };

    return (
        <div className={\`\${baseClasses} \${typeClasses[type] || typeClasses.info}\`}>
            {message}
        </div>
    );
}
`,
    "components/shared/ConfirmationModal.jsx": `
import React from 'react';

export default function ConfirmationModal({ show, message, onConfirm, onCancel }) {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-700 p-6 rounded-lg shadow-lg max-w-sm w-full text-center">
                <p className="text-white text-lg mb-6">{message}</p>
                <div className="flex justify-center space-x-4">
                    <button
                        onClick={onConfirm}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-5 rounded-full"
                    >
                        Confirm
                    </button>
                    <button
                        onClick={onCancel}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-5 rounded-full"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
`,
    "components/modals/BreakStartModal.jsx": `
import React from 'react';
import { useAppContext } from '../../context/AppContext.jsx';

export default function BreakStartModal() {
    const { 
        showBreakModal, 
        suggestedActivity, 
        startBreak, 
        pickNewSuggestedActivity 
    } = useAppContext();

    if (!showBreakModal) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
                <h2 className="text-3xl font-bold text-purple-300 mb-4">Break Time!</h2>
                <p className="text-gray-300 mb-2">Your suggested activity is:</p>
                <p className="text-2xl font-bold text-white bg-gray-700 rounded-lg p-4 mb-8">
                    {suggestedActivity?.name || 'Relax and recharge'}
                </p>
                <div className="flex flex-col space-y-4">
                    <button
                        onClick={startBreak}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg text-xl"
                    >
                        Start Break
                    </button>
                    <button
                        onClick={pickNewSuggestedActivity}
                        className="bg-gray-600 hover:bg-gray-500 text-gray-200 font-bold py-2 px-4 rounded-lg"
                    >
                        Suggest another
                    </button>
                </div>
            </div>
        </div>
    );
}
`,
    "components/Timer/index.jsx": `
import React from 'react';
import TimerDisplay from './TimerDisplay.jsx';
import TimerControls from './TimerControls.jsx';
import ActivityLogger from './ActivityLogger.jsx';

export default function TimerView() {
    return (
        <>
            <TimerDisplay />
            <TimerControls />
            <ActivityLogger />
        </>
    );
}
`,
    "components/Timer/TimerDisplay.jsx": `
import React from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import { formatTime } from '../../utils/formatTime.js';
import { PHASES } from '../../constants.js';

export default function TimerDisplay() {
    const { phase, timeLeft, totalDuration, pomodoroCount, suggestedActivity } = useAppContext();
    
    const progress = totalDuration > 0 ? (timeLeft / totalDuration) : 1;

    return (
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full text-center relative">
            <h1 className="text-4xl font-bold mb-4 text-purple-400">tomps</h1>
            <div className="text-lg font-medium text-gray-300 mb-6 capitalize">
                Current Phase: <span className="text-green-400">{phase.replace(/([A-Z])/g, ' $1').trim()}</span>
            </div>
            <div className="relative w-64 h-64 mx-auto mb-4">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle className="text-gray-700" strokeWidth="10" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                    <circle
                        className="text-blue-500"
                        strokeWidth="10"
                        strokeDasharray={2 * Math.PI * 40}
                        strokeDashoffset={2 * Math.PI * 40 * (1 - progress)}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                        transform="rotate(-90 50 50)"
                        style={{ transition: 'stroke-dashoffset 0.5s linear' }}
                    />
                    <text x="50" y="50" fill="white" fontSize="18" textAnchor="middle" alignmentBaseline="middle" className="font-extrabold">
                        {formatTime(timeLeft)}
                    </text>
                </svg>
            </div>
            <div className="text-md text-gray-400 mb-6">
                Pomodoros Completed: <span className="font-semibold text-white">{pomodoroCount}</span>
            </div>
            {(phase === PHASES.SHORT_BREAK || phase === PHASES.LONG_BREAK) && suggestedActivity && (
                <div className="bg-gray-700/50 p-3 rounded-lg">
                    <p className="text-sm text-gray-400">Your break activity:</p>
                    <p className="text-lg font-semibold text-teal-300">{suggestedActivity.name}</p>
                </div>
            )}
        </div>
    );
}
`,
    "components/Timer/TimerControls.jsx": `
import React from 'react';
import { useAppContext } from '../../context/AppContext.jsx';

export default function TimerControls() {
    const { isRunning, start, pause, skip, reset } = useAppContext();

    return (
        <div className="flex justify-center space-x-4 mb-8">
            {!isRunning ? (
                <button
                    onClick={start}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full"
                >
                    Start
                </button>
            ) : (
                <button
                    onClick={pause}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-8 rounded-full"
                >
                    Pause
                </button>
            )}
            <button
                onClick={skip}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full"
            >
                Skip
            </button>
            <button
                onClick={reset}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full"
            >
                Reset
            </button>
        </div>
    );
}
`,
    "components/Timer/ActivityLogger.jsx": `
import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import { addPomodoroTask, addBreakActivity } from '../../services/firebase.js';

export default function ActivityLogger() {
    const { showToast, pomodoroCount, settings, userId } = useAppContext();
    const [newTask, setNewTask] = useState('');
    const [newBreakActivity, setNewBreakActivity] = useState('');

    const handleLogTask = async () => {
        if (!newTask.trim() || !userId) return;
        try {
            await addPomodoroTask(userId, newTask, pomodoroCount, settings.workDuration);
            setNewTask('');
            showToast('Task logged!', 'success');
        } catch (e) {
            console.error("Error logging task:", e);
            showToast('Failed to log task.', 'error');
        }
    };

    const handleLogBreakActivity = async () => {
        if (!newBreakActivity.trim() || !userId) return;
        try {
            await addBreakActivity(userId, newBreakActivity);
            setNewBreakActivity('');
            showToast('Break activity logged!', 'success');
        } catch (e) {
            console.error("Error logging break activity:", e);
            showToast('Failed to log break activity.', 'error');
        }
    };

    return (
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-lg mt-8">
            <h3 className="text-xl font-bold mb-3 text-purple-300">Log Your Progress:</h3>
            <div className="mb-6">
                <h4 className="text-lg font-bold mb-2 text-gray-300">Pomodoro Tasks Completed:</h4>
                <div className="flex">
                    <input
                        type="text"
                        placeholder="What did you work on?"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        className="flex-grow p-3 rounded-l-lg bg-gray-700 border border-gray-600"
                    />
                    <button onClick={handleLogTask} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-r-lg">Log Task</button>
                </div>
            </div>
            <div>
                <h4 className="text-lg font-bold mb-2 text-gray-300">Break Activities Completed:</h4>
                <div className="flex">
                    <input
                        type="text"
                        placeholder="What did you do on your break?"
                        value={newBreakActivity}
                        onChange={(e) => setNewBreakActivity(e.target.value)}
                        className="flex-grow p-3 rounded-l-lg bg-gray-700 border border-gray-600"
                    />
                    <button onClick={handleLogBreakActivity} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-r-lg">Log Activity</button>
                </div>
            </div>
        </div>
    );
}
`,
    "components/Settings/index.jsx": `
import React from 'react';
import TimerSettings from './TimerSettings.jsx';
import ActivityManager from './ActivityManager.jsx';
import ActivityLibrary from './ActivityLibrary.jsx';

export default function SettingsView() {
    return (
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-lg">
            <h2 className="text-3xl font-bold mb-6 text-purple-400 text-center">Settings</h2>
            <TimerSettings />
            <ActivityManager />
            <ActivityLibrary />
        </div>
    );
}
`,
    "components/Settings/TimerSettings.jsx": `
import React from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import { SECONDS_IN_MINUTE } from '../../constants.js';
import { updateSettings } from '../../services/firebase.js';

export default function TimerSettings() {
    const { settings, showToast, userId } = useAppContext();

    const handleSettingChange = async (settingName, value) => {
        if (!userId) return;

        let updatedValue = value;
        const isDuration = ['workDuration', 'shortBreakDuration', 'longBreakDuration'].includes(settingName);

        if (isDuration) {
            updatedValue = parseInt(value, 10) * SECONDS_IN_MINUTE;
            if (isNaN(updatedValue) || updatedValue <= 0) {
                showToast('Duration must be a positive number.', 'error');
                return;
            }
        } else {
             updatedValue = parseInt(value, 10);
            if (isNaN(updatedValue) || updatedValue <= 0) {
                showToast('Pomodoros must be a positive number.', 'error');
                return;
            }
        }
        
        try {
            await updateSettings(userId, { [settingName]: updatedValue });
            showToast('Settings updated!', 'success');
        } catch (e) {
            console.error("Error updating setting:", e);
            showToast('Failed to update setting.', 'error');
        }
    };
    
    return (
        <div className="mb-8 p-4 border border-gray-700 rounded-lg">
            <h3 className="text-xl font-bold mb-4 text-purple-300">Timer Durations (Minutes)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="workDuration" className="text-gray-300 mb-1 block">Work:</label>
                    <input
                        id="workDuration"
                        type="number"
                        defaultValue={settings.workDuration / SECONDS_IN_MINUTE}
                        onBlur={(e) => handleSettingChange('workDuration', e.target.value)}
                        className="p-3 w-full rounded-lg bg-gray-700 border border-gray-600"
                        min="1"
                    />
                </div>
                <div>
                    <label htmlFor="shortBreakDuration" className="text-gray-300 mb-1 block">Short Break:</label>
                    <input
                        id="shortBreakDuration"
                        type="number"
                        defaultValue={settings.shortBreakDuration / SECONDS_IN_MINUTE}
                        onBlur={(e) => handleSettingChange('shortBreakDuration', e.target.value)}
                        className="p-3 w-full rounded-lg bg-gray-700 border border-gray-600"
                        min="1"
                    />
                </div>
                <div>
                    <label htmlFor="longBreakDuration" className="text-gray-300 mb-1 block">Long Break:</label>
                    <input
                        id="longBreakDuration"
                        type="number"
                        defaultValue={settings.longBreakDuration / SECONDS_IN_MINUTE}
                        onBlur={(e) => handleSettingChange('longBreakDuration', e.target.value)}
                        className="p-3 w-full rounded-lg bg-gray-700 border border-gray-600"
                        min="1"
                    />
                </div>
                <div>
                    <label htmlFor="pomodorosBeforeLongBreak" className="text-gray-300 mb-1 block">Pomodoros/Set:</label>
                    <input
                        id="pomodorosBeforeLongBreak"
                        type="number"
                        defaultValue={settings.pomodorosBeforeLongBreak}
                        onBlur={(e) => handleSettingChange('pomodorosBeforeLongBreak', e.target.value)}
                        className="p-3 w-full rounded-lg bg-gray-700 border border-gray-600"
                        min="1"
                    />
                </div>
            </div>
        </div>
    );
}
`,
    "components/Settings/ActivityManager.jsx": `
import React, { useState, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import { useCollection } from '../../hooks/useFirestore.jsx';
import { activitiesRef, addActivity, updateActivity, deleteActivity } from '../../services/firebase.js';
import ConfirmationModal from '../shared/ConfirmationModal.jsx';

export default function ActivityManager() {
    const { userId, showToast } = useAppContext();
    const activitiesRefFactory = useCallback(() => userId ? activitiesRef(userId) : null, [userId]);
    const { data: activities } = useCollection(activitiesRefFactory);

    const [newActivityName, setNewActivityName] = useState('');
    const [editingActivityId, setEditingActivityId] = useState(null);
    const [editingActivityName, setEditingActivityName] = useState('');
    
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [activityToDelete, setActivityToDelete] = useState(null);

    const handleAddActivity = async () => {
        if (!newActivityName.trim() || !userId) return;
        try {
            await addActivity(userId, newActivityName.trim(), 'General');
            setNewActivityName('');
            showToast('Activity added!', 'success');
        } catch (e) {
            showToast('Failed to add activity.', 'error');
        }
    };

    const handleToggleActivity = async (id, currentStatus) => {
        if (!userId) return;
        try {
            await updateActivity(userId, id, { active: !currentStatus });
            showToast(\`Activity \${!currentStatus ? 'enabled' : 'disabled'}.\`, 'info');
        } catch (e) {
            showToast('Failed to update activity.', 'error');
        }
    };

    const handleUpdateActivity = async (id) => {
        if (!editingActivityName.trim() || !userId) return;
        try {
            await updateActivity(userId, id, { name: editingActivityName.trim() });
            setEditingActivityId(null);
            showToast('Activity updated!', 'success');
        } catch (e) {
            showToast('Failed to update activity.', 'error');
        }
    };
    
    const openDeleteConfirmation = (id) => {
        setActivityToDelete(id);
        setShowConfirmModal(true);
    };

    const confirmDelete = async () => {
        if (!activityToDelete || !userId) return;
        try {
            await deleteActivity(userId, activityToDelete);
            showToast('Activity deleted.', 'success');
        } catch (e) {
            showToast('Failed to delete activity.', 'error');
        } finally {
            setShowConfirmModal(false);
            setActivityToDelete(null);
        }
    };

    return (
        <div className="p-4 border border-gray-700 rounded-lg">
            <h3 className="text-xl font-bold mb-4 text-purple-300">Manage Break Activities</h3>
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    placeholder="New activity name..."
                    value={newActivityName}
                    onChange={(e) => setNewActivityName(e.target.value)}
                    className="flex-grow p-3 rounded-lg bg-gray-700 border border-gray-600"
                />
                <button
                    onClick={handleAddActivity}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
                >
                    Add
                </button>
            </div>

            <ul className="space-y-2 max-h-80 overflow-y-auto">
                {activities?.map((activity) => (
                    <li key={activity.id} className="bg-gray-700 p-3 rounded-lg flex items-center justify-between">
                         {editingActivityId === activity.id ? (
                            <input
                                type="text"
                                value={editingActivityName}
                                onChange={(e) => setEditingActivityName(e.target.value)}
                                onBlur={() => handleUpdateActivity(activity.id)}
                                onKeyDown={(e) => e.key === 'Enter' && handleUpdateActivity(activity.id)}
                                className="p-2 rounded-md bg-gray-600 text-white flex-grow"
                                autoFocus
                            />
                        ) : (
                            <label className="flex items-center flex-grow text-white cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={activity.active}
                                    onChange={() => handleToggleActivity(activity.id, activity.active)}
                                    className="form-checkbox h-5 w-5 text-teal-500 rounded-md"
                                />
                                <span className={\`ml-3 text-lg \${!activity.active && 'line-through text-gray-400'}\`}>
                                    {activity.name}
                                </span>
                            </label>
                        )}
                        <div className="flex space-x-2 ml-4">
                            <button onClick={() => { setEditingActivityId(activity.id); setEditingActivityName(activity.name); }} className="text-blue-400 hover:text-blue-300">Edit</button>
                            <button onClick={() => openDeleteConfirmation(activity.id)} className="text-red-400 hover:text-red-300">Delete</button>
                        </div>
                    </li>
                ))}
            </ul>
             <ConfirmationModal 
                show={showConfirmModal}
                message="Are you sure you want to delete this activity?"
                onConfirm={confirmDelete}
                onCancel={() => setShowConfirmModal(false)}
            />
        </div>
    );
}
`,
    "components/Settings/ActivityLibrary.jsx": `
import React, { useMemo, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import { useCollection } from '../../hooks/useFirestore.jsx';
import { predefinedActivitiesRef, activitiesRef, addActivity } from '../../services/firebase.js';

export default function ActivityLibrary() {
    const { userId, showToast } = useAppContext();

    const { data: predefinedActivities } = useCollection(predefinedActivitiesRef, null);
    const userActivitiesRefFactory = useCallback(() => userId ? activitiesRef(userId) : null, [userId]);
    const { data: userActivities } = useCollection(userActivitiesRefFactory);

    const userActivityNames = useMemo(() => new Set((userActivities || []).map(act => act.name)), [userActivities]);

    const handleAddFromLibrary = async (activity) => {
        if (!userId) return;
        try {
            await addActivity(userId, activity.name, activity.category);
            showToast(\`'\${activity.name}' added to your list!\`, 'success');
        } catch (e) {
            console.error("Error adding activity from library:", e);
            showToast('Failed to add activity.', 'error');
        }
    };

    return (
        <div className="mt-8 p-4 border border-gray-700 rounded-lg">
            <h3 className="text-xl font-bold mb-4 text-purple-300">Activity Library</h3>
            <p className="text-gray-400 mb-4">Browse and add recommended activities to your personal list.</p>
            <ul className="space-y-2 max-h-80 overflow-y-auto">
                {predefinedActivities?.map((activity) => {
                    const isAdded = userActivityNames.has(activity.name);
                    return (
                        <li key={activity.id} className="bg-gray-700 p-3 rounded-lg flex items-center justify-between">
                            <div>
                                <p className="text-lg text-white">{activity.name}</p>
                                <p className="text-sm text-gray-400">{activity.category}</p>
                            </div>
                            <button
                                onClick={() => handleAddFromLibrary(activity)}
                                disabled={isAdded}
                                className={\`font-bold py-2 px-4 rounded-lg transition-colors \${
                                    isAdded 
                                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
                                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                                }\`}
                            >
                                {isAdded ? 'Added' : 'Add'}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
`,
    "components/Statistics/index.jsx": `
import React, { useMemo, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import { useCollection } from '../../hooks/useFirestore.jsx';
import { pomodoroTasksRef, breakActivitiesRef } from '../../services/firebase.js';
import { formatTime } from '../../utils/formatTime.js';
import HistoryList from './HistoryList.jsx';

export default function StatisticsView() {
    const { userId, settings } = useAppContext();
    
    const pomodoroTasksRefFactory = useCallback(() => userId ? pomodoroTasksRef(userId) : null, [userId]);
    const breakActivitiesRefFactory = useCallback(() => userId ? breakActivitiesRef(userId) : null, [userId]);

    const { data: pomodoroTasks } = useCollection(pomodoroTasksRefFactory);
    const { data: breakActivities } = useCollection(breakActivitiesRefFactory);

    const totalWorkSeconds = useMemo(() => {
        if (!pomodoroTasks) return 0;
        const defaultDuration = settings.workDuration;
        return pomodoroTasks.reduce((total, task) => total + (task.durationSeconds || defaultDuration), 0);
    }, [pomodoroTasks, settings.workDuration]);

    return (
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-lg">
            <h2 className="text-3xl font-bold mb-6 text-purple-400 text-center">Your Progress & History</h2>
            <div className="mb-8 p-4 border border-gray-700 rounded-lg">
                <h3 className="text-xl font-bold mb-4 text-purple-300">Overall Summary</h3>
                <p className="text-lg text-gray-200">
                    Total Pomodoros Logged: <span className="font-semibold text-white">{pomodoroTasks?.length || 0}</span>
                </p>
                <p className="text-lg text-gray-200">
                    Total Work Time Logged: <span className="font-semibold text-white">{formatTime(totalWorkSeconds)}</span>
                </p>
            </div>
            <HistoryList title="Pomodoro Task History" items={pomodoroTasks} type="task" />
            <HistoryList title="Completed Break Activities History" items={breakActivities} type="activity" />
        </div>
    );
}
`,
    "components/Statistics/HistoryList.jsx": `
import React from 'react';

export default function HistoryList({ title, items, type }) {
    return (
        <div className="mb-8 p-4 border border-gray-700 rounded-lg">
            <h3 className="text-xl font-bold mb-4 text-purple-300">{title}</h3>
            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2 text-sm">
                {items?.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">No history yet.</p>
                ) : (
                    items?.map((item) => (
                        <li key={item.id} className="bg-gray-700 p-2 rounded-lg text-gray-200">
                            <span className="font-semibold">{type === 'task' ? item.task : item.activity}</span>
                            <span className="text-gray-400 text-xs ml-2">
                                {item.timestamp ? new Date(item.timestamp.toDate()).toLocaleString() : ''}
                            </span>
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
}
`

};