import React from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import { formatTime } from '../../utils/formatTime';

export default function TimerDisplay() {
    const { phase, timeLeft, totalDuration, pomodoroCount } = useAppContext();
    const progress = totalDuration > 0 ? (timeLeft / totalDuration) : 1;

    return (
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl mb-8 w-full text-center relative">
            <h1 className="text-4xl font-bold mb-4 text-purple-400">Pomodoro Pro</h1>
            <div className="text-lg font-medium text-gray-300 mb-6 capitalize">
                Current Phase: <span className="text-green-400">{phase.replace(/([A-Z])/g, ' $1').trim()}</span>
            </div>

            <div className="relative w-64 h-64 mx-auto mb-8">
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
            <div className="text-md text-gray-400">
                Pomodoros Completed: <span className="font-semibold text-white">{pomodoroCount}</span>
            </div>
        </div>
    );
}