import React from 'react';

export default function Toast({ message, type }) {
    if (!message) return null;

    const baseClasses = 'fixed bottom-4 left-1/2 -translate-x-1/2 p-3 rounded-lg shadow-lg text-white z-50';
    const typeClasses = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-gray-600'
    };

    return (
        <div className={`${baseClasses} ${typeClasses[type] || typeClasses.info}`}>
            {message}
        </div>
    );
}