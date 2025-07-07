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