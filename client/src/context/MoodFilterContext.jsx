/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react';

/**
 * MoodFilterContext
 * -----------------
 * Shared state for the active mood filter so that:
 *   • MoodFeedBanner can auto-SET the filter based on today's mood
 *   • Sidebar mood list can manually SET it
 *   • Feed post query can READ it and filter posts accordingly
 *   • Everything stays in sync
 */
const MoodFilterContext = createContext();

export const useMoodFilter = () => {
    const context = useContext(MoodFilterContext);
    if (!context) {
        throw new Error('useMoodFilter must be used within a MoodFilterProvider');
    }
    return context;
};

export const MoodFilterProvider = ({ children }) => {
    // 'all' means no mood filter — show everything
    const [activeMood, setActiveMood] = useState('all');

    // Track whether the filter was auto-set by the banner (vs manually by user)
    const [isAutoSet, setIsAutoSet] = useState(false);

    /**
     * Set the active mood filter.
     * @param {string} moodId  - Feed filter ID ('all', 'calm', 'entertain', etc.)
     * @param {boolean} auto   - true if set automatically by banner, false if manual
     */
    const setMoodFilter = useCallback((moodId, auto = false) => {
        setActiveMood(moodId);
        setIsAutoSet(auto);
    }, []);

    const value = {
        activeMood,
        isAutoSet,
        setMoodFilter,
    };

    return (
        <MoodFilterContext.Provider value={value}>
            {children}
        </MoodFilterContext.Provider>
    );
};

export default MoodFilterContext;
