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