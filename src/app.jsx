import React, { useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import LoadingSpinner from './components/LoadingSpinner';
import Tabs from './components/shared/Tabs';
import Toast from './components/shared/Toast';
import TimerView from './components/Timer';
import SettingsView from './components/Settings';
import StatisticsView from './components/Statistics';
import BreakStartModal from './components/modals/BreakStartModal';
import WelcomeScreen from './components/WelcomeScreen';
import FeedbackWidget from './components/FeedbackWidget'; // 1. Import the new component

function AppContent() {
    const { isAuthReady, userId, toastMessage, showWelcomeScreen } = useAppContext();
    const [activeTab, setActiveTab] = useState('timer');

    if (!isAuthReady) {
        return <LoadingSpinner />;
    }

    if (showWelcomeScreen) {
        return <WelcomeScreen />;
    }

    const displayUserId = userId ? `User ID: ${userId.substring(0, 10)}...` : 'Authenticating...';

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
            <FeedbackWidget /> {/* 2. Add the widget here */}
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