import React from 'react';
import { useAppContext } from '../context/AppContext';

export default function WelcomeScreen() {
    const { dismissWelcomeScreen } = useAppContext();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-lg text-left">
                <h1 className="text-3xl font-bold text-purple-300 mb-4">🍅 Welcome to tomps!</h1>
                <p className="text-lg text-gray-300 mb-6">Here’s how to get started on your first productive session.</p>

                <ol className="list-decimal list-inside space-y-4 text-gray-200">
                    <li>
                        <span className="font-bold">Start the Timer:</span> The timer is set for a 25-minute focused work session. Hit "Start" and get to work on your task.
                    </li>
                    <li>
                        <span className="font-bold">Take an Intentional Break:</span> When the timer finishes, a modal will pop up with a suggested activity for your break.
                    </li>
                    <li>
                        <span className="font-bold">Begin Your Break:</span> Click "Start Break" to begin your 5-minute break timer. Use this time to complete the suggested activity!
                    </li>
                    <li>
                        <span className="font-bold">Repeat & Customize:</span> Repeat the cycle. Go to the "Settings" tab at any time to customize your timers and activities.
                    </li>
                </ol>

                <div className="mt-8 text-center">
                    <button
                        onClick={dismissWelcomeScreen}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-10 rounded-lg text-xl transition-transform transform hover:scale-105"
                    >
                        Get Started
                    </button>
                </div>
            </div>
        </div>
    );
}