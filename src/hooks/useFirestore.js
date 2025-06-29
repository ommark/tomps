import { useState, useEffect, useMemo } from 'react';
import { onSnapshot, query, orderBy } from 'firebase/firestore';

export function useCollection(refFactory) {
    const [data, setData] = useState([]);
    const [error, setError] = useState(null);

    const ref = useMemo(() => refFactory ? refFactory() : null, [refFactory]);

    useEffect(() => {
        if (!ref) {
            setData([]);
            return;
        }

        const q = query(ref, orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setData(fetchedData);
            setError(null);
        }, (err) => {
            console.error(err);
            setError('Failed to load data.');
        });

        return () => unsubscribe();
    }, [ref]);

    return { data, error };
}

export function useDocument(refFactory) {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const ref = useMemo(() => refFactory ? refFactory() : null, [refFactory]);

    useEffect(() => {
        if (!ref) {
            setData(null);
            return;
        }

        const unsubscribe = onSnapshot(ref, (doc) => {
            if (doc.exists()) {
                setData({ id: doc.id, ...doc.data() });
                setError(null);
            } else {
                setData(null);
            }
        }, (err) => {
            console.error(err);
            setError('Failed to load document.');
        });

        return () => unsubscribe();
    }, [ref]);

    return { data, error };
}