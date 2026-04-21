import express from 'express';
import Notification from '../models/Notification.js';
import SharedJourney from '../models/SharedJourney.js';
import JourneyMember from '../models/JourneyMember.js';
import User from '../models/User.js';
import Follow from '../models/Follow.js';
import { protect } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// ─── Helper ─────────────────────────────────────────────────────────────────
const isJourneyActive = (journey) =>
  !journey.closedAt && journey.deadline > new Date();

// ────────────────────────────────────────────────────────────────────────────
// @route   GET /api/notifications
// @desc    Get notifications for current user (journey invites + new followers)
// @access  Private
// ────────────────────────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('sender', 'username avatar role')
      .populate('journey', 'title prompt memberCount deadline closedAt')
      .lean();

    const now = new Date();

    // Batch-check which follower senders the current user already follows back
    const followerSenderIds = notifications
      .filter(n => n.type === 'new_follower' && n.sender?._id)
      .map(n => n.sender._id);

    let followingBackSet = new Set();
    if (followerSenderIds.length > 0) {
      const follows = await Follow.find({
        follower: req.user._id,
        followee: { $in: followerSenderIds }
      }).select('followee').lean();
      follows.forEach(f => followingBackSet.add(f.followee.toString()));
    }

    // Enrich notifications
    const enriched = notifications.map(n => {
      if (n.type === 'journey_invite' && n.journey) {
        return {
          ...n,
          journey: {
            ...n.journey,
            isActive: !n.journey.closedAt && n.journey.deadline > now,
            timeLeft: n.journey.deadline > now ? n.journey.deadline - now : 0
          }
        };
      }
      if (n.type === 'new_follower' && n.sender?._id) {
        return {
          ...n,
          isFollowingBack: followingBackSet.has(n.sender._id.toString())
        };
      }
      return n;
    });

    const unreadCount = enriched.filter(n => !n.isRead).length;
    res.json({ notifications: enriched, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
// ────────────────────────────────────────────────────────────────────────────
router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'All marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/notifications/:id/read
// @desc    Mark single notification as read
// @access  Private
// ────────────────────────────────────────────────────────────────────────────
router.put('/:id/read', protect, async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true }
    );
    res.json({ message: 'Marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// @route   POST /api/notifications/:id/maybe-later
// @desc    Opt into one expiry reminder for a journey invite
// @access  Private
// ────────────────────────────────────────────────────────────────────────────
router.post('/:id/maybe-later', protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
      type: 'journey_invite'
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.maybeLater = true;
    notification.isRead = true;
    await notification.save();

    res.json({ message: 'Reminder scheduled — we will ping you once when 24h remain.' });
  } catch (error) {
    console.error('Maybe later error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// @route   POST /api/notifications/invite
// @desc    Send journey invite notification to another user
// @access  Private (journey members / creators)
// ────────────────────────────────────────────────────────────────────────────
router.post('/invite', protect, async (req, res) => {
  try {
    const { journeyId, recipientId } = req.body;

    if (!journeyId || !recipientId) {
      return res.status(400).json({ message: 'journeyId and recipientId required' });
    }

    // Verify sender is a member of the journey
    const [journey, senderMembership, recipient] = await Promise.all([
      SharedJourney.findById(journeyId).select('title prompt deadline closedAt memberCount creator').lean(),
      JourneyMember.findOne({ journey: journeyId, user: req.user._id }).lean(),
      User.findById(recipientId).select('_id username').lean()
    ]);

    if (!journey) return res.status(404).json({ message: 'Journey not found' });
    if (!senderMembership) return res.status(403).json({ message: 'You must be a member to invite others' });
    if (!recipient) return res.status(404).json({ message: 'Recipient not found' });
    if (!isJourneyActive(journey)) return res.status(400).json({ message: 'Journey has ended — cannot invite' });

    // Check recipient isn't already a member
    const alreadyMember = await JourneyMember.findOne({ journey: journeyId, user: recipientId }).lean();
    if (alreadyMember) return res.status(400).json({ message: 'User is already a member' });

    // Upsert: don't spam — one invite per sender→recipient→journey
    const existing = await Notification.findOne({
      recipient: recipientId,
      sender: req.user._id,
      type: 'journey_invite',
      journey: journeyId
    });

    if (existing) {
      return res.status(400).json({ message: 'Invite already sent' });
    }

    await Notification.create({
      recipient: recipientId,
      sender: req.user._id,
      type: 'journey_invite',
      journey: journeyId
    });

    res.status(201).json({ message: 'Invite sent' });
  } catch (error) {
    console.error('Send invite error:', error);
    res.status(500).json({ message: 'Server error sending invite' });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// @route   POST /api/notifications/journey/:id/join
// @desc    Join a journey from a notification invite
// @access  Private
// ────────────────────────────────────────────────────────────────────────────
router.post('/journey/:id/join', protect, async (req, res) => {
  try {
    const { notificationId } = req.body;

    const journey = await SharedJourney.findById(req.params.id)
      .select('visibility deadline closedAt memberCount')
      .lean();

    if (!journey) return res.status(404).json({ message: 'Journey not found' });
    if (!isJourneyActive(journey)) return res.status(400).json({ message: 'Journey has ended' });

    const existing = await JourneyMember.findOne({ journey: journey._id, user: req.user._id }).lean();
    if (existing) return res.status(400).json({ message: 'Already a member' });

    await Promise.all([
      JourneyMember.create({ journey: journey._id, user: req.user._id, role: 'member' }),
      SharedJourney.findByIdAndUpdate(journey._id, { $inc: { memberCount: 1 } })
    ]);

    // Mark notification as read
    if (notificationId) {
      await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: req.user._id },
        { isRead: true }
      );
    }

    res.json({ message: 'Joined successfully', journeyId: journey._id });
  } catch (error) {
    console.error('Join from notification error:', error);
    res.status(500).json({ message: 'Server error joining journey' });
  }
});

export default router;
