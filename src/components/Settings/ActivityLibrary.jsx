import React, { useMemo, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import { useCollection } from '../../hooks/useFirestore.jsx';
import { predefinedActivitiesRef, activitiesRef, addActivity } from '../../services/firebase.js';

export default function ActivityLibrary() {
    const { userId, showToast } = useAppContext();

    const { data: predefinedActivities } = useCollection(predefinedActivitiesRef, null);
    const userActivitiesRefFactory = useCallback(() => userId ? activitiesRef(userId) : null, [userId]);
    const { data: userActivities } = useCollection(userActivitiesRefFactory);

    const userActivityNames = useMemo(() => new Set((userActivities || []).map(act => act.name)), [userActivities]);

    const handleAddFromLibrary = async (activity) => {
        if (!userId) return;
        try {
            await addActivity(userId, activity.name, activity.category);
            showToast(`'${activity.name}' added to your list!`, 'success');
        } catch (e) {
            console.error("Error adding activity from library:", e);
            showToast('Failed to add activity.', 'error');
        }
    };

    return (
        <div className="mt-8 p-4 border border-gray-700 rounded-lg">
            <h3 className="text-xl font-bold mb-4 text-purple-300">Activity Library</h3>
            <p className="text-gray-400 mb-4">Browse and add recommended activities to your personal list.</p>
            <ul className="space-y-2 max-h-80 overflow-y-auto">
                {predefinedActivities?.map((activity) => {
                    const isAdded = userActivityNames.has(activity.name);
                    return (
                        <li key={activity.id} className="bg-gray-700 p-3 rounded-lg flex items-center justify-between">
                            <div>
                                <p className="text-lg text-white">{activity.name}</p>
                                <p className="text-sm text-gray-400">{activity.category}</p>
                            </div>
                            <button
                                onClick={() => handleAddFromLibrary(activity)}
                                disabled={isAdded}
                                className={`font-bold py-2 px-4 rounded-lg transition-colors ${
                                    isAdded 
                                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
                                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                                }`}
                            >
                                {isAdded ? 'Added' : 'Add'}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}