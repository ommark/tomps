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