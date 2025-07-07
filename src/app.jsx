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