import { useState, useEffect, useMemo } from 'react';
import { onSnapshot, query, orderBy } from 'firebase/firestore';

// FIX: The default value for orderByField is removed to prevent unintended ordering.
export function useCollection(refFactory, orderByField, orderByDirection = 'desc') {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const ref = useMemo(() => refFactory ? refFactory() : null, [refFactory]);

    useEffect(() => {
        if (!ref) {
            setData([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        // FIX: The query is now only constructed with orderBy if orderByField is provided.
        // This makes the hook more flexible and fixes the bug with predefined_activities.
        const q = orderByField ? query(ref, orderBy(orderByField, orderByDirection)) : ref;

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setData(fetchedData);
            setError(null);
            setLoading(false);
        }, (err) => {
            console.error(err);
            setError('Failed to load data.');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [ref, orderByField, orderByDirection]);

    return { data, error, loading };
}

export function useDocument(refFactory) {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const ref = useMemo(() => refFactory ? refFactory() : null, [refFactory]);

    useEffect(() => {
        if (!ref) {
            setData(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = onSnapshot(ref, (doc) => {
            if (doc.exists()) {
                setData({ id: doc.id, ...doc.data() });
                setError(null);
            } else {
                setData(null);
            }
            setLoading(false);
        }, (err) => {
            console.error(err);
            setError('Failed to load document.');
            setLoading(false);
        });
        return () => unsubscribe();
    }, [ref]);

    return { data, error, loading };
}