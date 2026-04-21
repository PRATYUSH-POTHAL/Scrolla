import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTodayMood } from '../hooks/useTodayMood';
import { useMoodFilter } from '../context/MoodFilterContext';
import { useAuth } from '../context/AuthContext';
import { MOODS } from '../utils/constants';
import './MoodFeedBanner.css';

// ── Emoji map matching the DB mood keys ──
const MOOD_EMOJIS = {
    joyful: '😄', happy: '😊', energised: '⚡', calm: '😌',
    neutral: '😐', anxious: '😰', sad: '😢', angry: '😠',
};

// ── Heavy/negative moods → Scenario A ──
const heavyMoods = ['anxious', 'angry', 'sad'];

// ── Positive moods → Scenario B ──
const positiveMoods = ['joyful', 'happy', 'energised', 'calm'];

// ── Scenario A: heavy mood → suggested calming feed filter ──
// Maps mood log DB key → feed filter ID (from constants.js MOODS)
const moodSuggestion = {
    anxious: 'calm',       // → Calm posts
    angry:   'calm',       // → Calm posts
    sad:     'low',        // → Reflective posts (filter id='low', label='Reflective')
};

// ── Scenario B: positive mood → matching feed filter ──
const positiveToFilter = {
    joyful:    'entertain',   // filter id='entertain', label='Joyful'
    happy:     'entertain',
    energised: 'energetic',   // filter id='energetic', label='Energetic'
    calm:      'calm',
};

/** Capitalize first letter */
function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

/** Get the human-readable label for a feed filter ID */
function getFilterLabel(filterId) {
    const found = MOODS.find(m => m.id === filterId);
    return found ? found.label : capitalize(filterId);
}

/** LocalStorage key includes userId + today's date so it auto-expires next day */
function getDismissalKey(userId) {
    const today = new Date().toISOString().slice(0, 10);
    return `scrolla_banner_dismissed_${userId}_${today}`;
}

/**
 * MoodFeedBanner
 * ---------------
 * Inline card that sits at the top of the feed (below tabs, above posts).
 * Three scenarios based on today's logged mood:
 *   A) Heavy mood  → auto-filter to calming content, show chip row
 *   B) Positive    → auto-filter to matching content
 *   C) Not logged  → soft prompt to log mood
 *
 * Dismissible per day via localStorage.
 * No popups, no modals — purely inline.
 */
export default function MoodFeedBanner() {
    const { user } = useAuth();
    const { todayMood, hasLoggedToday, loading } = useTodayMood();
    const { setMoodFilter } = useMoodFilter();
    const navigate = useNavigate();

    const [dismissed, setDismissed] = useState(false);
    const [visible, setVisible] = useState(false);
    const hasAutoSet = useRef(false);

    // ── Check localStorage dismissal on mount ──
    useEffect(() => {
        if (user?._id) {
            const key = getDismissalKey(user._id);
            if (localStorage.getItem(key) === 'true') {
                setDismissed(true);
            }
        }
    }, [user?._id]);

    // ── Auto-set feed filter ONCE when mood data loads ──
    useEffect(() => {
        if (loading || hasAutoSet.current || dismissed) return;

        if (hasLoggedToday && todayMood) {
            if (heavyMoods.includes(todayMood)) {
                // Scenario A: auto-set to a calming/reflective filter
                const suggested = moodSuggestion[todayMood] || 'calm';
                setMoodFilter(suggested, true);
            } else if (positiveMoods.includes(todayMood)) {
                // Scenario B: auto-set to matching mood filter
                const matching = positiveToFilter[todayMood] || 'all';
                setMoodFilter(matching, true);
            }
            // neutral → leave as 'all', no auto-filter
        }
        // Scenario C (not logged) → leave as 'all'

        hasAutoSet.current = true;
    }, [loading, todayMood, hasLoggedToday, dismissed, setMoodFilter]);

    // ── Fade-in after data loads ──
    useEffect(() => {
        if (!loading && !dismissed) {
            const t = setTimeout(() => setVisible(true), 50);
            return () => clearTimeout(t);
        }
    }, [loading, dismissed]);

    // ── Dismiss handler ──
    const handleDismiss = () => {
        setVisible(false);
        // Wait for fade-out animation before removing from DOM
        setTimeout(() => {
            setDismissed(true);
            if (user?._id) {
                localStorage.setItem(getDismissalKey(user._id), 'true');
            }
        }, 300);
    };

    // ── Don't render if already dismissed today ──
    if (dismissed) return null;

    // ── Loading skeleton: grey rounded rect, no spinner ──
    if (loading) {
        return (
            <div className="mood-banner-skeleton" id="mood-banner-loading">
                <div className="mood-banner-skeleton-line wide" />
                <div className="mood-banner-skeleton-line narrow" />
            </div>
        );
    }

    // ── Determine scenario ──
    const isHeavy = hasLoggedToday && heavyMoods.includes(todayMood);
    const isPositive = hasLoggedToday && (positiveMoods.includes(todayMood) || todayMood === 'neutral');
    const notLogged = !hasLoggedToday;

    // ── SCENARIO A — Heavy/negative mood ──
    if (isHeavy) {
        const suggestedFilter = moodSuggestion[todayMood] || 'calm';
        const filterLabel = getFilterLabel(suggestedFilter);

        return (
            <div className={`mood-banner mood-banner--heavy ${visible ? 'mood-banner--visible' : ''}`} id="mood-banner-heavy">
                <div className="mood-banner__content">
                    <div className="mood-banner__text">
                        <span className="mood-banner__emoji">{MOOD_EMOJIS[todayMood]}</span>
                        <p>
                            You're feeling <strong>{capitalize(todayMood)}</strong> today — we've filtered to{' '}
                            <strong>{filterLabel}</strong> posts to help. Change anytime.
                        </p>
                    </div>
                    <button className="mood-banner__dismiss" onClick={handleDismiss} title="Dismiss" aria-label="Dismiss banner">
                        ✕
                    </button>
                </div>
                {/* Mood chip row — user can switch to any mood manually */}
                <div className="mood-banner__chips">
                    {MOODS.filter(m => m.id !== 'all').map(m => (
                        <button
                            key={m.id}
                            className="mood-banner__chip"
                            onClick={() => setMoodFilter(m.id)}
                            title={m.label}
                        >
                            {m.emoji} {m.label}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // ── SCENARIO B — Positive / neutral mood ──
    if (isPositive) {
        return (
            <div className={`mood-banner mood-banner--positive ${visible ? 'mood-banner--visible' : ''}`} id="mood-banner-positive">
                <div className="mood-banner__content">
                    <div className="mood-banner__text">
                        <span className="mood-banner__emoji">{MOOD_EMOJIS[todayMood]}</span>
                        <p>
                            You're feeling <strong>{capitalize(todayMood)}</strong> today — your feed is tuned to match. Enjoy.
                        </p>
                    </div>
                    <button className="mood-banner__dismiss" onClick={handleDismiss} title="Dismiss" aria-label="Dismiss banner">
                        ✕
                    </button>
                </div>
            </div>
        );
    }

    // ── SCENARIO C — Not logged today ──
    if (notLogged) {
        return (
            <div className={`mood-banner mood-banner--neutral ${visible ? 'mood-banner--visible' : ''}`} id="mood-banner-prompt">
                <div className="mood-banner__content">
                    <div className="mood-banner__text">
                        <span className="mood-banner__emoji">🌤️</span>
                        <p>How are you feeling today? Log your mood to get a personalised feed.</p>
                    </div>
                    <button className="mood-banner__dismiss" onClick={handleDismiss} title="Dismiss" aria-label="Dismiss banner">
                        ✕
                    </button>
                </div>
                <div className="mood-banner__actions">
                    <button
                        className="mood-banner__btn mood-banner__btn--primary"
                        onClick={() => navigate(`/profile/${user?._id}?tab=moodlog`)}
                    >
                        Log mood
                    </button>
                    <button
                        className="mood-banner__btn mood-banner__btn--secondary"
                        onClick={handleDismiss}
                    >
                        Maybe later
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
