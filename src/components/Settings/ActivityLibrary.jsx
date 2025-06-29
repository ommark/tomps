import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, // CORRECTED THIS LINE
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// --- COMPLETE Firestore Service Functions ---
const getDocPath = (userId, collectionName, docId) => `users/${userId}/${collectionName}/${docId}`;
const getCollectionPath = (userId, collectionName) => `users/${userId}/${collectionName}`;

// Settings
export const settingsRef = (userId) => doc(db, getDocPath(userId, 'settings', 'userSettings'));
export const updateSettings = (userId, data) => setDoc(settingsRef(userId), data, { merge: true });

// Activities
export const activitiesRef = (userId) => collection(db, getCollectionPath(userId, 'activities'));
export const addActivity = (userId, name, category) => addDoc(activitiesRef(userId), { name, category: category || 'General', active: true, isCustom: true, timestamp: serverTimestamp() });
export const updateActivity = (userId, id, data) => updateDoc(doc(db, getCollectionPath(userId, 'activities'), id), data);
export const deleteActivity = (userId, id) => deleteDoc(doc(db, getCollectionPath(userId, 'activities'), id));

// Predefined Activities
export const predefinedActivitiesRef = () => collection(db, 'predefined_activities');

// Pomodoro Tasks
export const pomodoroTasksRef = (userId) => collection(db, getCollectionPath(userId, 'pomodoroTasks'));
export const addPomodoroTask = (userId, task, pomodoroCount, durationSeconds) => addDoc(pomodoroTasksRef(userId), { task, pomodoroCountAtCompletion: pomodoroCount, durationSeconds, timestamp: serverTimestamp() });

// Break Activities
export const breakActivitiesRef = (userId) => collection(db, getCollectionPath(userId, 'breakActivitiesCompleted'));
export const addBreakActivity = (userId, activity) => addDoc(breakActivitiesRef(userId), { activity, timestamp: serverTimestamp() });