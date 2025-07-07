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