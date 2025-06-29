import React, { useState, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useCollection } from '../../hooks/useFirestore';
import { activitiesRef, addActivity, updateActivity, deleteActivity } from '../../services/firebase';
import ConfirmationModal from '../shared/ConfirmationModal';

export default function ActivityManager() {
    const { userId, showToast } = useAppContext();
    const activitiesRefFactory = useCallback(() => userId ? activitiesRef(userId) : null, [userId]);
    const { data: activities } = useCollection(activitiesRefFactory);

    const [newActivityName, setNewActivityName] = useState('');
    const [editingActivityId, setEditingActivityId] = useState(null);
    const [editingActivityName, setEditingActivityName] = useState('');

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [activityToDelete, setActivityToDelete] = useState(null);

    const handleAddActivity = async () => {
        if (!newActivityName.trim() || !userId) return;
        try {
            await addActivity(userId, newActivityName.trim(), 'General');
            setNewActivityName('');
            showToast('Activity added!', 'success');
        } catch (e) {
            showToast('Failed to add activity.', 'error');
        }
    };

    const handleToggleActivity = async (id, currentStatus) => {
        if (!userId) return;
        try {
            await updateActivity(userId, id, { active: !currentStatus });
            showToast(`Activity ${!currentStatus ? 'enabled' : 'disabled'}.`, 'info');
        } catch (e) {
            showToast('Failed to update activity.', 'error');
        }
    };

    const handleUpdateActivity = async (id) => {
        if (!editingActivityName.trim() || !userId) return;
        try {
            await updateActivity(userId, id, { name: editingActivityName.trim() });
            setEditingActivityId(null);
            showToast('Activity updated!', 'success');
        } catch (e) {
            showToast('Failed to update activity.', 'error');
        }
    };

    const openDeleteConfirmation = (id) => {
        setActivityToDelete(id);
        setShowConfirmModal(true);
    };

    const confirmDelete = async () => {
        if (!activityToDelete || !userId) return;
        try {
            await deleteActivity(userId, activityToDelete);
            showToast('Activity deleted.', 'success');
        } catch (e) {
            showToast('Failed to delete activity.', 'error');
        } finally {
            setShowConfirmModal(false);
            setActivityToDelete(null);
        }
    };

    return (
        <div className="p-4 border border-gray-700 rounded-lg">
            <h3 className="text-xl font-bold mb-4 text-purple-300">Manage Break Activities</h3>
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    placeholder="New activity name..."
                    value={newActivityName}
                    onChange={(e) => setNewActivityName(e.target.value)}
                    className="flex-grow p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                />
                <button
                    onClick={handleAddActivity}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
                >
                    Add
                </button>
            </div>

            <ul className="space-y-2 max-h-80 overflow-y-auto">
                {activities?.map((activity) => (
                    <li key={activity.id} className="bg-gray-700 p-3 rounded-lg flex items-center justify-between">
                        {editingActivityId === activity.id ? (
                            <input
                                type="text"
                                value={editingActivityName}
                                onChange={(e) => setEditingActivityName(e.target.value)}
                                onBlur={() => handleUpdateActivity(activity.id)}
                                onKeyDown={(e) => e.key === 'Enter' && handleUpdateActivity(activity.id)}
                                className="p-2 rounded-md bg-gray-600 text-white flex-grow"
                                autoFocus
                            />
                        ) : (
                            <label className="flex items-center flex-grow text-white cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={activity.active}
                                    onChange={() => handleToggleActivity(activity.id, activity.active)}
                                    className="form-checkbox h-5 w-5 text-teal-500 rounded-md"
                                />
                                <span className={`ml-3 text-lg ${!activity.active && 'line-through text-gray-400'}`}>
                                    {activity.name}
                                </span>
                            </label>
                        )}
                        <div className="flex space-x-2 ml-4">
                            <button onClick={() => { setEditingActivityId(activity.id); setEditingActivityName(activity.name); }} className="text-blue-400 hover:text-blue-300">Edit</button>
                            <button onClick={() => openDeleteConfirmation(activity.id)} className="text-red-400 hover:text-red-300">Delete</button>
                        </div>
                    </li>
                ))}
            </ul>
            <ConfirmationModal
                show={showConfirmModal}
                message="Are you sure you want to delete this activity?"
                onConfirm={confirmDelete}
                onCancel={() => setShowConfirmModal(false)}
            />
        </div>
    );
}