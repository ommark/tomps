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