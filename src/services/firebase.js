import { initializeApp } from 'firebase/app';
import { initializeAuth, indexedDBLocalPersistence } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
    persistence: indexedDBLocalPersistence
});
export const db = getFirestore(app);

const getDocPath = (userId, collectionName, docId) => `users/${userId}/${collectionName}/${docId}`;
const getCollectionPath = (userId, collectionName) => `users/${userId}/${collectionName}`;

export const settingsRef = (userId) => doc(db, getDocPath(userId, 'settings', 'userSettings'));
export const updateSettings = (userId, data) => setDoc(settingsRef(userId), data, { merge: true });

export const activitiesRef = (userId) => collection(db, getCollectionPath(userId, 'activities'));
export const addActivity = (userId, name, category) => addDoc(activitiesRef(userId), { name, category: category || 'General', active: true, isCustom: true, timestamp: serverTimestamp() });
export const updateActivity = (userId, id, data) => updateDoc(doc(db, getCollectionPath(userId, 'activities'), id), data);
export const deleteActivity = (userId, id) => deleteDoc(doc(db, getCollectionPath(userId, 'activities'), id));

export const predefinedActivitiesRef = () => collection(db, 'predefined_activities');

export const pomodoroTasksRef = (userId) => collection(db, getCollectionPath(userId, 'pomodoroTasks'));
export const addPomodoroTask = (userId, task, pomodoroCount, durationSeconds) => addDoc(pomodoroTasksRef(userId), { task, pomodoroCountAtCompletion: pomodoroCount, durationSeconds, timestamp: serverTimestamp() });

export const breakActivitiesRef = (userId) => collection(db, getCollectionPath(userId, 'breakActivitiesCompleted'));
export const addBreakActivity = (userId, activity) => addDoc(breakActivitiesRef(userId), { activity, timestamp: serverTimestamp() });

export const addFeedback = (userId, feedbackText) => {
    const feedbackCollection = collection(db, 'feedback');
    return addDoc(feedbackCollection, {
        userId: userId,
        feedback: feedbackText,
        createdAt: serverTimestamp(),
        appVersion: '1.0-mvp'
    });
};

export const initializeNewUser = async (userId, defaultSettings, starterActivities) => {
    const batch = writeBatch(db);
    const userSettingsRef = settingsRef(userId);
    batch.set(userSettingsRef, { ...defaultSettings, starterPackAdded: true });
    const userActivitiesRef = activitiesRef(userId);
    for (const activity of starterActivities) {
        const newActivityRef = doc(userActivitiesRef);
        batch.set(newActivityRef, { 
            name: activity.name, 
            category: activity.category, 
            active: true, 
            isCustom: false, 
            timestamp: serverTimestamp() 
        });
    }
    await batch.commit();
};