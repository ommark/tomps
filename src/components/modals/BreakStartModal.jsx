import React from 'react';
import { useAppContext } from '../../context/AppContext.jsx';

export default function BreakStartModal() {
    const { 
        showBreakModal, 
        suggestedActivity, 
        startBreak, 
        pickNewSuggestedActivity 
    } = useAppContext();

    if (!showBreakModal) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
                <h2 className="text-3xl font-bold text-purple-300 mb-4">Break Time!</h2>
                <p className="text-gray-300 mb-2">Your suggested activity is:</p>
                <p className="text-2xl font-bold text-white bg-gray-700 rounded-lg p-4 mb-8">
                    {suggestedActivity?.name || 'Relax and recharge'}
                </p>
                <div className="flex flex-col space-y-4">
                    <button
                        onClick={startBreak}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg text-xl"
                    >
                        Start Break
                    </button>
                    <button
                        onClick={pickNewSuggestedActivity}
                        className="bg-gray-600 hover:bg-gray-500 text-gray-200 font-bold py-2 px-4 rounded-lg"
                    >
                        Suggest another
                    </button>
                </div>
            </div>
        </div>
    );
}