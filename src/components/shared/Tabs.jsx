import React from 'react';

export default function Tabs({ activeTab, setActiveTab }) {
    const tabs = ['timer', 'settings', 'statistics'];
    return (
        <div className="flex bg-gray-800 rounded-full p-1 mb-8 shadow-inner">
            {tabs.map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2 rounded-full text-lg font-semibold transition duration-300 capitalize ${activeTab === tab ? 'bg-purple-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700'}`}
                >
                    {tab}
                </button>
            ))}
        </div>
    );
}