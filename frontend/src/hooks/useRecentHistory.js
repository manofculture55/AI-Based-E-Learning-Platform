import { useState, useEffect } from 'react';
import api from '../api/client';

export function useRecentHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;

        const fetchHistory = async () => {
            try {
                const res = await api.get('/history');
                if (mounted) {
                    // API returns sorted by newest first already
                    // We limit to 5 here for dashboard purposes? 
                    // Actually, let's return all and let component decide, 
                    // or just slice here if this hook is strictly for "Recent".
                    // 'useRecentHistory' implies a limit. Let's slice 5.
                    setHistory(res.data.history.slice(0, 5));
                    setError(null);
                }
            } catch (err) {
                if (mounted) {
                    setError(err.response?.data?.error || 'Failed to load history');
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchHistory();

        return () => { mounted = false; };
    }, []);

    return { history, loading, error };
}
