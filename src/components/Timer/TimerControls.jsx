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