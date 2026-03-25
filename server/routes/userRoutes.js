import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Follow from '../models/Follow.js';
import { protect } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/optionalAuth.js';

const router = express.Router();

// @route   GET /api/users/suggested
// @desc    Get suggested users (not followed by current user)
// @access  Private
router.get('/suggested', protect, async (req, res) => {
    try {
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
        const result = await Promise.all(users.map(async (u) => {
            const followerCount = await Follow.countDocuments({ followee: u._id });
            return {
                ...u,
                followerCount
            };
        }));

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
        const user = await User.findById(req.params.id)
            .select('-password -savedPosts -hiddenPosts -reportedPosts');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const [followerCount, followingCount, isFollowingRecord] = await Promise.all([
            Follow.countDocuments({ followee: user._id }),
            Follow.countDocuments({ follower: user._id }),
            req.user ? Follow.exists({ follower: req.user._id, followee: user._id }) : Promise.resolve(null)
        ]);

        res.json({
            ...user.toJSON(),
            followerCount,
            followingCount,
            isFollowing: !!isFollowingRecord
        });
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
    body('avatar').optional().isURL()
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

        const { username, bio, avatar } = req.body;
        const updateFields = {};

        if (username) updateFields.username = username;
        if (bio !== undefined) updateFields.bio = bio;
        if (avatar) updateFields.avatar = avatar;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true, runValidators: true }
        ).select('-password');

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
            .sort({ createdAt: -1 });

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
            .sort({ createdAt: -1 });

        res.json(following.map(f => f.followee).filter(Boolean));
    } catch (error) {
        console.error('Get following error:', error);
        res.status(500).json({ message: 'Server error fetching following' });
    }
});

export default router;
