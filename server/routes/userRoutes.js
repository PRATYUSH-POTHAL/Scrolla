import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Follow from '../models/Follow.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { CACHE_KEYS, cacheGet, cacheSet, cacheClear } from '../cache/index.js';
import { publisher, CHANNELS } from '../cache/pubsub.js';

const router = express.Router();

// @route   GET /api/users/suggested
// @desc    Get suggested users (not followed by current user)
// @access  Private
router.get('/suggested', protect, async (req, res) => {
    try {
        const cacheKey = CACHE_KEYS.SUGGESTED_USERS(req.user._id.toString());
        const cachedData = await cacheGet(cacheKey);
        if (cachedData) return res.json(cachedData);
        // Find users the current user is already following
        const followingRecords = await Follow.find({ follower: req.user._id }).select('followee');
        const followingIds = followingRecords.map(f => f.followee.toString());
        
        const excludeIds = [...followingIds, req.user._id.toString()];

        const users = await User.find({
            _id: { $nin: excludeIds }
        })
        .select('username avatar bio')
        .limit(10)
        .sort({ createdAt: -1 })
        .lean();

        // Get follower count for each suggested user
        const userIds = users.map(u => u._id);
        const followerCounts = await Follow.aggregate([
            { $match: { followee: { $in: userIds } } },
            { $group: { _id: '$followee', count: { $sum: 1 } } }
        ]);
        
        const countMap = Object.fromEntries(
            followerCounts.map(f => [f._id.toString(), f.count])
        );
        
        const result = users.map(u => ({
            ...u,
            followerCount: countMap[u._id.toString()] || 0
        }));

        await cacheSet(cacheKey, result, 300); // cache for 5 minutes

        res.json(result);
    } catch (error) {
        console.error('Get suggested users error:', error);
        res.status(500).json({ message: 'Server error fetching suggested users' });
    }
});

// @route   GET /api/users/:id
// @desc    Get user profile by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const cacheKey = CACHE_KEYS.USER_PROFILE(req.params.id);
        if (!req.user) { // Only cache for public requests to avoid caching `isFollowing` state globally
            const cachedData = await cacheGet(cacheKey);
            if (cachedData) return res.json(cachedData);
        }

        const user = await User.findById(req.params.id)
            .select('-password -savedPosts -hiddenPosts -reportedPosts')
            .lean();

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const [followerCount, followingCount, isFollowingRecord] = await Promise.all([
            Follow.countDocuments({ followee: user._id }),
            Follow.countDocuments({ follower: user._id }),
            req.user ? Follow.exists({ follower: req.user._id, followee: user._id }) : Promise.resolve(null)
        ]);

        const result = {
            ...user,
            followerCount,
            followingCount,
            isFollowing: !!isFollowingRecord
        };

        if (!req.user) await cacheSet(cacheKey, result, 60);

        res.json(result);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error fetching user' });
    }
});

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private
router.put('/:id', protect, [
    body('username').optional().trim().isLength({ min: 3, max: 30 }),
    body('bio').optional().isLength({ max: 200 }),
    body('avatar').optional().isURL(),
    body('location').optional().trim().isLength({ max: 100 }),
    body('website').optional().trim().isLength({ max: 200 }),
    body('role').optional().trim().isLength({ max: 50 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Check if user is updating their own profile
        if (req.user._id.toString() !== req.params.id) {
            return res.status(403).json({ message: 'Not authorized to update this profile' });
        }

        const { username, bio, avatar, location, website, role } = req.body;
        const updateFields = {};

        if (username) updateFields.username = username;
        if (bio !== undefined) updateFields.bio = bio;
        if (avatar) updateFields.avatar = avatar;
        if (location !== undefined) updateFields.location = location;
        if (website !== undefined) updateFields.website = website;
        if (role !== undefined) updateFields.role = role;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true, runValidators: true }
        ).select('-password');

        await cacheClear(`user:${req.params.id}`);
        await cacheClear('feed:*'); // Bust feed if avatar/username changed
        publisher.publish(CHANNELS.USER_UPDATED, JSON.stringify({ userId: req.params.id }));

        res.json(user);
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Server error updating profile' });
    }
});

// @route   POST /api/users/:id/follow
// @desc    Follow a user
// @access  Private
router.post('/:id/follow', protect, async (req, res) => {
    try {
        const userToFollow = await User.findById(req.params.id);

        if (!userToFollow) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Can't follow yourself
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot follow yourself' });
        }

        // Check if already following
        const existingFollow = await Follow.findOne({
            follower: req.user._id,
            followee: req.params.id
        });

        if (existingFollow) {
            return res.status(400).json({ message: 'Already following this user' });
        }

        // Create follow record
        await Follow.create({
            follower: req.user._id,
            followee: req.params.id
        });

        // Fire new_follower notification (upsert – no duplicate spam)
        await Notification.findOneAndUpdate(
            { recipient: req.params.id, sender: req.user._id, type: 'new_follower' },
            { recipient: req.params.id, sender: req.user._id, type: 'new_follower', isRead: false },
            { upsert: true, new: true }
        );

        await cacheClear(`user:${req.params.id}`);
        await cacheClear(`suggested:${req.user._id.toString()}`);

        res.json({ message: 'Successfully followed user' });
    } catch (error) {
        console.error('Follow error:', error);
        res.status(500).json({ message: 'Server error following user' });
    }
});

// @route   DELETE /api/users/:id/follow
// @desc    Unfollow a user
// @access  Private
router.delete('/:id/follow', protect, async (req, res) => {
    try {
        const deletedFollow = await Follow.findOneAndDelete({
            follower: req.user._id,
            followee: req.params.id
        });

        if (!deletedFollow) {
            return res.status(400).json({ message: 'Not following this user' });
        }

        // Remove the corresponding new_follower notification
        await Notification.findOneAndDelete({
            recipient: req.params.id,
            sender: req.user._id,
            type: 'new_follower'
        });

        await cacheClear(`user:${req.params.id}`);
        await cacheClear(`suggested:${req.user._id.toString()}`);

        res.json({ message: 'Successfully unfollowed user' });
    } catch (error) {
        console.error('Unfollow error:', error);
        res.status(500).json({ message: 'Server error unfollowing user' });
    }
});

// @route   GET /api/users/:id/followers
// @desc    Get user's followers
// @access  Public
router.get('/:id/followers', async (req, res) => {
    try {
        const followers = await Follow.find({ followee: req.params.id })
            .populate('follower', 'username avatar bio')
            .sort({ createdAt: -1 })
            .lean();

        res.json(followers.map(f => f.follower).filter(Boolean));
    } catch (error) {
        console.error('Get followers error:', error);
        res.status(500).json({ message: 'Server error fetching followers' });
    }
});

// @route   GET /api/users/:id/following
// @desc    Get users being followed
// @access  Public
router.get('/:id/following', async (req, res) => {
    try {
        const following = await Follow.find({ follower: req.params.id })
            .populate('followee', 'username avatar bio')
            .sort({ createdAt: -1 })
            .lean();

        res.json(following.map(f => f.followee).filter(Boolean));
    } catch (error) {
        console.error('Get following error:', error);
        res.status(500).json({ message: 'Server error fetching following' });
    }
});

export default router;
