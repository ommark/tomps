import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth } from '../services/firebase';

export function useAuth() {
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        // Explicitly set persistence to be local to the browser.
        setPersistence(auth, browserLocalPersistence)
            .then(() => {
                // Now that persistence is set, create the auth state listener.
                // onAuthStateChanged will now correctly use the persisted user session.
                const unsubscribe = onAuthStateChanged(auth, async (user) => {
                    if (user) {
                        // A user is signed in (either from persistence or a new anonymous session)
                        setUser(user);
                    } else {
                        // No user is signed in, create a new anonymous one.
                        try {
                            await signInAnonymously(auth);
                        } catch (error) {
                            console.error("Firebase Anonymous Sign-in error:", error);
                        }
                    }
                    setIsAuthReady(true);
                });
                return () => unsubscribe();
            })
            .catch((error) => {
                console.error("Firebase Persistence error:", error);
                setIsAuthReady(true);
            });

    }, []); // This runs only once when the app starts.

    return { user, userId: user?.uid, isAuthReady };
}