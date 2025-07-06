import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from '../services/firebase';

export function useAuth() {
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        // This listener will now use the pre-configured auth instance
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // A user is signed in (either from persistence or new)
                setUser(user);
            } else {
                // No user found, so create a new anonymous one
                try {
                    await signInAnonymously(auth);
                } catch (error) {
                    console.error("Firebase Anonymous Sign-in error:", error);
                }
            }
            setIsAuthReady(true);
        });

        return () => unsubscribe();
    }, []);

    return { user, userId: user?.uid, isAuthReady };
}