import mongoose from 'mongoose';

const MOODS = ['joyful', 'happy', 'calm', 'neutral', 'anxious', 'sad', 'angry', 'energised'];
const TIME_OF_DAYS = ['morning', 'afternoon', 'evening', 'night'];

const moodLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    mood: {
        type: String,
        enum: MOODS,
        required: true
    },
    note: {
        type: String,
        maxlength: [300, 'Note cannot exceed 300 characters'],
        default: ''
    },
    energy: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
    },
    // Time of day for multi-entry days
    timeOfDay: {
        type: String,
        enum: TIME_OF_DAYS,
        default: 'afternoon'
    },
    // Date only (no time) stored as YYYY-MM-DD string so we can enforce one-per-day easily
    date: {
        type: String,          // e.g. "2026-04-20"
        required: true
    },
    loginSession: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Allow multiple logs per day, so no unique index on date
// moodLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export const MOOD_EMOJIS = {
    joyful:    '😄',
    happy:     '😊',
    calm:      '😌',
    neutral:   '😐',
    anxious:   '😰',
    sad:       '😢',
    angry:     '😠',
    energised: '⚡'
};

export const MOOD_COLORS = {
    joyful:    '#FFF3CD',   // warm yellow
    happy:     '#FFE4CC',   // peach
    calm:      '#D4F1E4',   // mint
    neutral:   '#E8E8E8',   // grey
    anxious:   '#FFD6D6',   // light red
    sad:       '#D6E4FF',   // light blue
    angry:     '#FFB8B8',   // red
    energised: '#FFF0B3'    // electric yellow
};

const MoodLog = mongoose.model('MoodLog', moodLogSchema);
export default MoodLog;
