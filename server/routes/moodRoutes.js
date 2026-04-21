import express from 'express';
import MoodLog, { MOOD_EMOJIS, MOOD_COLORS } from '../models/MoodLog.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

function getISTDateString(date) {
    const ist = new Date(date.getTime() + 
        date.getTimezoneOffset() * 60000 + 5.5 * 3600000);
    const y = ist.getFullYear();
    const m = String(ist.getMonth() + 1).padStart(2, '0');
    const d = String(ist.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getISTNow() {
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    return new Date(Date.now() + IST_OFFSET);
}

function getCurrentISTWeekDates() {
    const now = getISTNow();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, i) => {
        const day = new Date(monday);
        day.setDate(monday.getDate() + i);
        return getISTDateString(day);
    });
}

/** GET /api/moods/today  — returns today's mood log for the current user (lightweight, for banner) */
router.get('/today', protect, async (req, res) => {
    try {
        const today = getISTDateString(new Date());
        const log = await MoodLog.findOne({ userId: req.user._id, date: today }).sort({ createdAt: -1 });

        if (!log) {
            return res.json({ mood: null, hasLoggedToday: false });
        }

        res.json({
            mood: log.mood,
            emoji: MOOD_EMOJIS[log.mood],
            color: MOOD_COLORS[log.mood],
            note: log.note,
            energy: log.energy,
            timeOfDay: log.timeOfDay,
            date: log.date,
            hasLoggedToday: true
        });
    } catch (err) {
        console.error('Today mood error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

/** GET /api/moods/week  — returns this week's logs (Mon–Sun) for the current user */
router.get('/week', protect, async (req, res) => {
    try {
        const weekDates = getCurrentISTWeekDates();

        const logs = await MoodLog.find({
            userId: req.user._id,
            date: { $in: weekDates }
        }).sort({ date: 1 });

        // Group logs by date
        const logMap = {};
        logs.forEach(l => { 
            if (!logMap[l.date]) logMap[l.date] = [];
            logMap[l.date].push(l);
        });

        const week = weekDates.map(date => {
            const dayLogs = logMap[date] || [];
            return {
                date,
                logged: dayLogs.length > 0,
                // Primary mood is the latest one (since we sorted by date/time ascending, it's the last one in the array, or we can use the first one. Let's use the first one from the day as primary, or last one. Let's send them all)
                logs: dayLogs.map(log => ({
                    _id: log._id,
                    mood: log.mood,
                    emoji: MOOD_EMOJIS[log.mood],
                    color: MOOD_COLORS[log.mood],
                    note: log.note,
                    energy: log.energy,
                    timeOfDay: log.timeOfDay,
                    loginSession: log.loginSession,
                    createdAt: log.createdAt
                })),
                mood: dayLogs.length > 0 ? dayLogs[dayLogs.length - 1].mood : null,
                emoji: dayLogs.length > 0 ? MOOD_EMOJIS[dayLogs[dayLogs.length - 1].mood] : null,
                color: dayLogs.length > 0 ? MOOD_COLORS[dayLogs[dayLogs.length - 1].mood] : null,
            };
        });

        res.json({ week, weekDates });
    } catch (err) {
        console.error('Mood week error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

/** GET /api/moods/stats  — daysLogged, topMood, currentStreak */
router.get('/stats', protect, async (req, res) => {
    try {
        const allLogs = await MoodLog.find({ userId: req.user._id }).sort({ date: -1 });

        // Distinct dates only
        const distinctDates = [...new Set(allLogs.map(l => l.date))].sort().reverse();
        const daysLogged = distinctDates.length;

        // Top mood for THIS WEEK only
        const weekDates = getCurrentISTWeekDates();
        const thisWeekLogs = allLogs.filter(l => weekDates.includes(l.date));
        
        const moodCount = {};
        thisWeekLogs.forEach(l => { moodCount[l.mood] = (moodCount[l.mood] || 0) + 1; });
        const topMood = thisWeekLogs.length > 0
            ? Object.entries(moodCount).sort((a, b) => b[1] - a[1])[0][0]
            : null;

        // Streak
        let streak = 0;
        if (distinctDates.length > 0) {
            const todayStr = getISTDateString(new Date());
            const yesterdayDate = new Date();
            yesterdayDate.setDate(yesterdayDate.getDate() - 1);
            const yesterdayStr = getISTDateString(yesterdayDate);

            // "This resets to 0 if today has no entry yet."
            // Wait, BUG 1 says: "If not → reset streak to 1 (streak broken). If yes → increment streak."
            // "Starting from today going backwards in IST calendar days, count how many consecutive days..."
            // Let's iterate backwards starting from today
            let currentCheckDate = new Date();
            let keepCounting = true;

            while (keepCounting) {
                const checkStr = getISTDateString(currentCheckDate);
                if (distinctDates.includes(checkStr)) {
                    streak++;
                    currentCheckDate.setDate(currentCheckDate.getDate() - 1);
                } else {
                    // "Stop counting when you hit a day with zero entries. This resets to 0 if today has no entry yet."
                    keepCounting = false;
                }
            }
        }

        res.json({
            daysLogged,
            topMood,
            topMoodEmoji: topMood ? MOOD_EMOJIS[topMood] : null,
            streak
        });
    } catch (err) {
        console.error('Mood stats error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

/** POST /api/moods  — log (or update) today's mood */
router.post('/', protect, async (req, res) => {
    try {
        const { mood, note, energy, timeOfDay, loginSession } = req.body;
        if (!mood) return res.status(400).json({ message: 'Mood is required' });

        const today = getISTDateString(new Date());

        // Ensure the old unique index is dropped from the database
        try {
            await MoodLog.collection.dropIndex('userId_1_date_1');
        } catch (e) {
            // Index might not exist anymore, ignore
        }

        const log = await MoodLog.create({
            userId: req.user._id,
            mood,
            note: note || '',
            energy: energy || 3,
            timeOfDay: timeOfDay || 'afternoon',
            date: today,
            loginSession: loginSession || false
        });

        res.json({
            _id: log._id,
            mood: log.mood,
            emoji: MOOD_EMOJIS[log.mood],
            color: MOOD_COLORS[log.mood],
            note: log.note,
            energy: log.energy,
            timeOfDay: log.timeOfDay,
            date: log.date
        });
    } catch (err) {
        console.error('Log mood error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

/** DELETE /api/moods/today  — remove today's log */
router.delete('/today', protect, async (req, res) => {
    try {
        const today = getISTDateString(new Date());
        await MoodLog.deleteOne({ userId: req.user._id, date: today });
        res.json({ message: 'Log removed' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
