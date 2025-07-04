import { useState, useEffect, useMemo } from 'react';
import { onSnapshot, query, orderBy } from 'firebase/firestore';

// The useCollection hook is now more flexible
export function useCollection(refFactory, orderByField = 'timestamp', orderByDirection = 'desc') {
    const [data, setData] = useState([]);
    const [error, setError] = useState(null);

    const ref = useMemo(() => refFactory ? refFactory() : null, [refFactory]);

    useEffect(() => {
        if (!ref) {
            setData([]);
            return;
        }

        // Only add the 'orderBy' clause if an orderByField is provided
        let q = ref;
        if (orderByField) {
            q = query(ref, orderBy(orderByField, orderByDirection));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setData(fetchedData);
            setError(null);
        }, (err) => {
            console.error(err);
            setError('Failed to load data.');
        });

        return () => unsubscribe();
    }, [ref, orderByField, orderByDirection]);

    return { data, error };
}

// The useDocument hook remains the same and is correct
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