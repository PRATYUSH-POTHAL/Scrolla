import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['journey_invite', 'new_follower'],
    required: true
  },
  // ── sender (the person who followed or sent the invite) ──
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // ── journey_invite specific ──
  journey: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SharedJourney',
    default: null
  },
  // Whether user clicked "Maybe later" (opt-in one reminder)
  maybeLater: {
    type: Boolean,
    default: false
  },
  // Whether the "maybe later" reminder has already been sent
  reminderSent: {
    type: Boolean,
    default: false
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for fast per-user queries
notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
