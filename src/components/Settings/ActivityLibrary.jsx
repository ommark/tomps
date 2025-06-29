import React, { useMemo, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useCollection } from '../../hooks/useFirestore';
import { predefinedActivitiesRef, activitiesRef, addActivity } from '../../services/firebase';

export default function ActivityLibrary() {
    const { userId, showToast } = useAppContext();

    // Fetch the master list of predefined activities from the public collection
    const { data: predefinedActivities } = useCollection(predefinedActivitiesRef);

    // Fetch the user's personal list of activities to check which ones they already have
    const userActivitiesRefFactory = useCallback(() => userId ? activitiesRef(userId) : null, [userId]);
    const { data: userActivities } = useCollection(userActivitiesRefFactory);

    // Create a quick lookup set of the names of activities the user already has.
    // The `|| []` prevents a crash if the user's activity list is still loading.
    const userActivityNames = useMemo(() => new Set((userActivities || []).map(act => act.name)), [userActivities]);

    const handleAddFromLibrary = async (activity) => {
        if (!userId) return;
        try {
            // Copy the predefined activity into the user's personal list
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
                        <li key={activity.id} className="bg-gray-700 p-3 rounded-lg flex items-