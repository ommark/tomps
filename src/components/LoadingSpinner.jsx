import React from 'react';

export default function LoadingSpinner() {
    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 font-inter">
            <div className="text-xl font-bold text-blue-300 animate-pulse">Loading Application...</div>
            <p className="text-gray-400 mt-2">Please wait while we set things up.</p>
        </div>
    );
}