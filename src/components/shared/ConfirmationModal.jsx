import React from 'react';

export default function ConfirmationModal({ show, message, onConfirm, onCancel }) {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-700 p-6 rounded-lg shadow-lg max-w-sm w-full text-center">
                <p className="text-white text-lg mb-6">{message}</p>
                <div className="flex justify-center space-x-4">
                    <button
                        onClick={onConfirm}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-5 rounded-full"
                    >
                        Confirm
                    </button>
                    <button
                        onClick={onCancel}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-5 rounded-full"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}