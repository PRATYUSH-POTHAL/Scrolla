import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import './MoodLog.css';

const MOODS = [
    { key: 'joyful',    emoji: '😄', label: 'Joyful',    color: '#FFF3CD', textColor: '#92620A' },
    { key: 'happy',     emoji: '😊', label: 'Happy',     color: '#FFE4CC', textColor: '#A0522D' },
    { key: 'energised', emoji: '⚡', label: 'Energised', color: '#FFF0B3', textColor: '#7A6000' },
    { key: 'calm',      emoji: '😌', label: 'Calm',      color: '#D4F1E4', textColor: '#1A6B45' },
    { key: 'neutral',   emoji: '😐', label: 'Neutral',   color: '#E8E8E8', textColor: '#555'   },
    { key: 'anxious',   emoji: '😰', label: 'Anxious',   color: '#FFD6D6', textColor: '#A0180A' },
    { key: 'sad',       emoji: '😢', label: 'Sad',       color: '#D6E4FF', textColor: '#1A3A7A' },
    { key: 'angry',     emoji: '😠', label: 'Angry',     color: '#FFB8B8', textColor: '#8B0000' },
];

import { getCurrentISTWeek } from '../utils/ist';

function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

export default function MoodLog({ isOwnProfile }) {
    const [weekData, setWeekData]     = useState([]);
    const [weekDates, setWeekDates]   = useState([]);
    const [stats, setStats]           = useState({ daysLogged: 0, topMood: null, topMoodEmoji: null, streak: 0 });
    const [loading, setLoading]       = useState(true);
    const [activeDay, setActiveDay]   = useState(null); // For showing breakdown

    const istWeek = getCurrentISTWeek();
    const weekLabel = `${istWeek[0].month} ${istWeek[0].date} – ${istWeek[6].month !== istWeek[0].month ? istWeek[6].month + ' ' : ''}${istWeek[6].date}`;

    const fetchData = useCallback(async () => {
        try {
            const [weekRes, statsRes] = await Promise.all([
                api.get('/moods/week'),
                api.get('/moods/stats')
            ]);
            setWeekData(weekRes.data.week);
            setWeekDates(weekRes.data.weekDates);
            setStats(statsRes.data);
        } catch (err) {
            // Silently degrade — user might not have any logs yet
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Handle clicking a bar to show breakdown
    const handleBarClick = (day) => {
        if (day.logged) {
            setActiveDay(activeDay?.date === day.date ? null : day);
        }
    };

    // Bar chart max height reference (for scaling)
    const maxBarHeight = 120; // px

    return (
        <div className="moodlog-root">
            {loading ? (
                <div className="moodlog-loading">
                    <div className="moodlog-spinner" />
                    <span>Loading your mood history…</span>
                </div>
            ) : (
                <>
                    {/* ── Chart Card ── */}
                    <div className="moodlog-chart-card">
                        <div className="moodlog-chart-header">
                            <div>
                                <h3 className="moodlog-chart-title">Your mood this week</h3>
                                <p className="moodlog-chart-range">{weekLabel}</p>
                            </div>
                        </div>

                        {/* Bar Chart */}
                        <div className="moodlog-bars">
                            {istWeek.map((dayDef, i) => {
                                const apiDay = weekData.find(d => d.date === dayDef.dateStr);
                                const isToday = dayDef.isToday;
                                const isFuture = dayDef.isFuture;
                                const hasLogs = apiDay && apiDay.logged;
                                const logs = hasLogs ? apiDay.logs : [];
                                
                                const barHeight = hasLogs ? maxBarHeight : 0;
                                const primaryMoodMeta = hasLogs && logs.length > 0 ? MOODS.find(m => m.key === logs[0].mood) : null;
                                
                                return (
                                    <div key={dayDef.dateStr} className="moodlog-bar-col" style={{ position: 'relative' }}>
                                        <div
                                            className={`moodlog-bar-wrap ${isToday ? 'today' : ''} ${isFuture ? 'future' : ''} ${activeDay?.date === dayDef.dateStr ? 'active' : ''}`}
                                            style={{ height: `${maxBarHeight}px`, cursor: hasLogs ? 'pointer' : 'default' }}
                                            onClick={() => handleBarClick(apiDay)}
                                        >
                                            {hasLogs ? (
                                                <div
                                                    className="moodlog-bar-fill"
                                                    style={{
                                                        height: `${barHeight}px`,
                                                        background: primaryMoodMeta?.color || '#E8E8E8',
                                                        display: 'flex',
                                                        flexDirection: logs.length === 2 ? 'row' : 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        overflow: 'hidden'
                                                    }}
                                                    title={`${dayDef.label}: ${capitalize(logs[0].mood)}`}
                                                >
                                                    {logs.length === 1 && (
                                                        <span className="moodlog-bar-emoji">{logs[0].emoji}</span>
                                                    )}
                                                    {logs.length === 2 && (
                                                        <>
                                                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: MOODS.find(m => m.key === logs[0].mood)?.color }}>
                                                                <span style={{ fontSize: '16px' }}>{logs[0].emoji}</span>
                                                            </div>
                                                            <div style={{ width: '1px', background: 'rgba(0,0,0,0.1)', height: '100%' }} />
                                                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: MOODS.find(m => m.key === logs[1].mood)?.color }}>
                                                                <span style={{ fontSize: '16px' }}>{logs[1].emoji}</span>
                                                            </div>
                                                        </>
                                                    )}
                                                    {logs.length >= 3 && (
                                                        <>
                                                            <span className="moodlog-bar-emoji">{logs[0].emoji}</span>
                                                            <div style={{ fontSize: '12px', color: '#F7931A', fontWeight: 'bold', marginTop: '4px' }}>
                                                                +{logs.length - 1}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ) : isFuture ? (
                                                /* Future day — lock icon, cannot log */
                                                <div className="moodlog-bar-future" style={{ height: `${maxBarHeight}px` }}>
                                                    <span className="moodlog-bar-lock">🔒</span>
                                                </div>
                                            ) : isToday ? (
                                                /* Today's empty bar — dotted outline */
                                                <div className="moodlog-bar-today-empty" style={{ height: `${maxBarHeight}px` }}>
                                                </div>
                                            ) : (
                                                /* Past day — no data, show small grey dot */
                                                <div className="moodlog-bar-empty-dot" />
                                            )}
                                        </div>

                                        <span className={`moodlog-bar-label ${isToday ? 'today' : ''} ${isFuture ? 'future' : ''}`} style={isToday ? { color: '#F7931A', fontWeight: 'bold' } : {}}>
                                            {isToday ? 'Today' : dayDef.label}
                                        </span>

                                        {/* Breakdown tooltip */}
                                        {activeDay?.date === dayDef.dateStr && hasLogs && (
                                            <div className="moodlog-breakdown-tooltip" style={{
                                                position: 'absolute',
                                                top: '130px',
                                                left: i < 4 ? '100%' : 'auto',
                                                right: i >= 4 ? '100%' : 'auto',
                                                marginLeft: i < 4 ? '10px' : '0',
                                                marginRight: i >= 4 ? '10px' : '0',
                                                background: '#1A1814',
                                                border: '1px solid #333',
                                                borderRadius: '12px',
                                                padding: '16px',
                                                width: '260px',
                                                zIndex: 10,
                                                boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                                            }}>
                                                <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginBottom: '12px', fontWeight: '600' }}>
                                                    {new Date(dayDef.dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} — {logs.length} Logins
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    {logs.map((log, idx) => {
                                                        const logTime = new Date(log.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                                                        return (
                                                            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                                                <div style={{ fontSize: '20px', lineHeight: '1' }}>{log.emoji}</div>
                                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>{capitalize(log.mood)}</span>
                                                                    <span style={{ fontSize: '12px', color: '#888' }}>
                                                                        {logTime} · {capitalize(log.timeOfDay)} login
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Stat Cards ── */}
                    <div className="moodlog-stats">
                        <div className="moodlog-stat-card">
                            <span className="moodlog-stat-value">{stats.daysLogged}</span>
                            <span className="moodlog-stat-label">Days logged</span>
                        </div>
                        <div className="moodlog-stat-card accent">
                            <span className="moodlog-stat-value accent">
                                {stats.topMood ? (
                                    <>{stats.topMoodEmoji} {capitalize(stats.topMood)}</>
                                ) : '—'}
                            </span>
                            <span className="moodlog-stat-label">Top mood</span>
                        </div>
                        <div className="moodlog-stat-card">
                            <span className="moodlog-stat-value">{stats.streak}</span>
                            <span className="moodlog-stat-label">Day streak</span>
                        </div>
                    </div>

                    {/* ── No-logs CTA ── */}
                    {stats.daysLogged === 0 && isOwnProfile && (
                        <div className="moodlog-empty-cta">
                            <span className="moodlog-empty-icon">🌱</span>
                            <p>Start tracking how you feel each day.</p>
                            <p className="moodlog-empty-sub">Your mood patterns will be recorded when you log in.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
