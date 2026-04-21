import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * useTodayMood()
 * ---------------
 * Fetches the most recent mood log entry for the current user where date = today.
 *
 * Returns:
 *   todayMood      — mood key string (e.g. 'joyful', 'anxious') or null
 *   hasLoggedToday — boolean, true if user has a mood entry for today
 *   loading        — boolean, true while fetching
 */
export function useTodayMood() {
    const { user } = useAuth();
    const [todayMood, setTodayMood] = useState(null);
    const [hasLoggedToday, setHasLoggedToday] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // No user → nothing to fetch
        if (!user?._id) {
            setLoading(false);
            return;
        }

        let cancelled = false;

        const fetchTodayMood = async () => {
            try {
                const res = await api.get('/moods/today');

                if (cancelled) return;

                if (res.data && res.data.mood) {
                    setTodayMood(res.data.mood);
                    setHasLoggedToday(true);
                } else {
                    setTodayMood(null);
                    setHasLoggedToday(false);
                }
            } catch {
                // No mood logged today or network error — degrade silently
                if (!cancelled) {
                    setTodayMood(null);
                    setHasLoggedToday(false);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchTodayMood();

        return () => { cancelled = true; };
    }, [user?._id]);

    return { todayMood, hasLoggedToday, loading };
}
