import { useState, useEffect } from 'react';
import api from '../api/client';

export function useStats() {
    const [stats, setStats] = useState({ 
        time_spent: '0m', 
        topics_learned: 0, 
        questions_solved: 0, 
        accuracy: 0 
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;

        const fetchStats = async () => {
            try {
                const res = await api.get('/stats');
                if (mounted) {
                    setStats(res.data);
                    setError(null);
                }
            } catch (err) {
                if (mounted) {
                    setError(err.response?.data?.error || 'Failed to load stats');
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchStats();

        return () => { mounted = false; };
    }, []);

    return { stats, loading, error };
}
