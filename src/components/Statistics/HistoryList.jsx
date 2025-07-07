import React from 'react';

export default function HistoryList({ title, items, type }) {
    return (
        <div className="mb-8 p-4 border border-gray-700 rounded-lg">
            <h3 className="text-xl font-bold mb-4 text-purple-300">{title}</h3>
            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2 text-sm">
                {items?.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">No history yet.</p>
                ) : (
                    items?.map((item) => (
                        <li key={item.id} className="bg-gray-700 p-2 rounded-lg text-gray-200">
                            <span className="font-semibold">{type === 'task' ? item.task : item.activity}</span>
                            <span className="text-gray-400 text-xs ml-2">
                                {item.timestamp ? new Date(item.timestamp.toDate()).toLocaleString() : ''}
                            </span>
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
}