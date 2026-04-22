import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { verifyGoogleToken } from '../utils/googleAuth.js';

const router = express.Router();

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', authLimiter, [
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email or username' });
        }

        // Create user with default avatar
        const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
        const user = await User.create({
            username,
            email,
            password,
            avatar
        });

        // Return user info and token
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            kidsMode: user.kidsMode,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, [
    body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if user has a password (email/password signup) or only Google OAuth
        if (!user.password) {
            return res.status(401).json({ 
                message: 'This account was created with Google OAuth. Please use the "Continue with Google" button to login.',
                loginMethod: 'google_only'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Return user info and token
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            bio: user.bio,
            kidsMode: user.kidsMode,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// @route   POST /api/auth/google
// @desc    Google OAuth login/register with account linking detection
// @access  Public
router.post('/google', authLimiter, async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ message: 'Google token is required' });
        }

        // Verify Google token
        const verification = await verifyGoogleToken(token);

        if (!verification.success) {
            return res.status(401).json({ message: verification.error });
        }

        const { googleId, email, name, picture } = verification.data;

        // Check if user exists with this googleId (already linked)
        let user = await User.findOne({ googleId });
        
        if (user) {
            // User already has Google linked - direct login
            const jwtToken = generateToken(user._id);
            return res.json({
                status: 'success',
                _id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                bio: user.bio,
                kidsMode: user.kidsMode,
                token: jwtToken
            });
        }

        // Check if email exists (potential account linking scenario)
        user = await User.findOne({ email });

        if (user) {
            // User exists with this email but no googleId
            // Return pending_link status with user data for confirmation
            return res.status(200).json({
                status: 'pending_link',
                message: 'Account found. Confirm to link Google account.',
                existingUser: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    avatar: user.avatar,
                    createdAt: user.createdAt
                },
                googleData: {
                    googleId,
                    name,
                    picture,
                    email
                },
                // Store in session-like object on frontend to confirm later
                tempToken: Buffer.from(JSON.stringify({ googleId, email, name, picture })).toString('base64')
            });
        }

        // No existing user - create new account
        let username = name
            .toLowerCase()
            .replace(/\s+/g, '.')
            .replace(/[^\w.-]/g, '');

        // Check if username already exists
        let usernameExists = await User.findOne({ username });
        if (usernameExists) {
            username = `${username}.${Date.now()}`;
        }

        user = await User.create({
            username,
            email,
            googleId,
            avatar: picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        });

        // Generate JWT token
        const jwtToken = generateToken(user._id);

        res.json({
            status: 'success',
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            bio: user.bio,
            kidsMode: user.kidsMode,
            token: jwtToken
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ message: 'Server error during Google authentication' });
    }
});

// @route   POST /api/auth/google/callback
// @desc    Handle Google Login redirect flow (ux_mode="redirect")
// @access  Public
router.post('/google/callback', authLimiter, async (req, res) => {
    // Determine client URL for redirect
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    
    try {
        const { credential } = req.body;
        
        if (!credential) {
            return res.redirect(`${clientUrl}/login?error=Google+login+failed`);
        }

        // Verify Google ID token
        const verification = await verifyGoogleToken(credential);
        if (!verification.success) {
             return res.redirect(`${clientUrl}/login?error=Invalid+Google+token`);
        }

        const { googleId, email, name, picture } = verification.data;

        // Check if user exists with this googleId (already linked)
        let user = await User.findOne({ googleId });
        
        if (user) {
            const jwtToken = generateToken(user._id);
            return res.redirect(`${clientUrl}/login?token=${jwtToken}`);
        }

        // Check if email exists (potential account linking)
        user = await User.findOne({ email });
        if (user) {
            // Account linking required
            const tempToken = Buffer.from(JSON.stringify({ googleId, email, name, picture })).toString('base64');
            const encodedUser = encodeURIComponent(JSON.stringify({
                _id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar
            }));
            return res.redirect(`${clientUrl}/login?pending_link=true&tempToken=${tempToken}&existingUser=${encodedUser}`);
        }

        // Create new user
        let username = name.toLowerCase().replace(/\s+/g, '.').replace(/[^\w.-]/g, '');
        const usernameExists = await User.findOne({ username });
        if (usernameExists) username = `${username}.${Date.now()}`;

        user = await User.create({
            username, 
            email, 
            googleId, 
            avatar: picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
        });

        const jwtToken = generateToken(user._id);
        return res.redirect(`${clientUrl}/login?token=${jwtToken}`);

    } catch (error) {
        console.error('Google callback error:', error);
        return res.redirect(`${clientUrl}/login?error=Server+error+during+login`);
    }
});

// @route   POST /api/auth/google-access-token
// @desc    Google OAuth via access_token (from useGoogleLogin hook — avoids popup blocker)
// @access  Public
router.post('/google-access-token', authLimiter, async (req, res) => {
    try {
        const { accessToken } = req.body;

        if (!accessToken) {
            return res.status(400).json({ message: 'Access token is required' });
        }

        // Securely fetch user info from Google using the access token
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        if (!userInfoRes.ok) {
            return res.status(401).json({ message: 'Invalid Google access token' });
        }
        
        const userInfo = await userInfoRes.json();
        const { sub: googleId, email, name, picture } = userInfo;

        if (!googleId || !email) {
            return res.status(400).json({ message: 'Invalid Google user info' });
        }

        // Check if user exists with this googleId (already linked)
        let user = await User.findOne({ googleId });

        if (user) {
            const jwtToken = generateToken(user._id);
            return res.json({
                status: 'success',
                _id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                bio: user.bio,
                kidsMode: user.kidsMode,
                token: jwtToken
            });
        }

        // Check if email exists (potential account linking)
        user = await User.findOne({ email });
        if (user) {
            return res.status(200).json({
                status: 'pending_link',
                message: 'Account found. Confirm to link Google account.',
                existingUser: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    avatar: user.avatar,
                    createdAt: user.createdAt
                },
                googleData: { googleId, name, picture, email }
            });
        }

        // New user — create account
        let username = name
            .toLowerCase()
            .replace(/\s+/g, '.')
            .replace(/[^\w.-]/g, '');

        const usernameExists = await User.findOne({ username });
        if (usernameExists) username = `${username}.${Date.now()}`;

        user = await User.create({
            username,
            email,
            googleId,
            avatar: picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        });

        const jwtToken = generateToken(user._id);
        res.json({
            status: 'success',
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            bio: user.bio,
            kidsMode: user.kidsMode,
            token: jwtToken
        });
    } catch (error) {
        console.error('Google access-token auth error:', error);
        res.status(500).json({ message: 'Server error during Google authentication' });
    }
});

// @route   POST /api/auth/google/confirm-link
// @desc    Confirm linking existing account with Google
// @access  Public
router.post('/google/confirm-link', authLimiter, async (req, res) => {
    try {
        const { userId, token } = req.body;

        if (!userId || !token) {
            return res.status(400).json({ message: 'Missing userId or token' });
        }

        // Verify Google token (access token or tempToken)
        let googleId, picture;
        
        // Check if it's a tempToken (base64 encoded JSON) from redirect flow
        try {
            const decoded = Buffer.from(token, 'base64').toString('utf8');
            const parsed = JSON.parse(decoded);
            if (parsed.googleId) {
                googleId = parsed.googleId;
                picture = parsed.picture;
            }
        } catch (e) {
            // Not a tempToken, try access token verification
        }

        if (!googleId) {
            try {
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const userInfo = await userInfoRes.json();
                
                if (!userInfo.sub) {
                    return res.status(401).json({ message: 'Invalid Google token' });
                }
                
                googleId = userInfo.sub;
                picture = userInfo.picture;
            } catch (error) {
                console.error('Error verifying access token:', error);
                return res.status(401).json({ message: 'Failed to verify Google token' });
            }
        }

        // First, get the user to check avatar
        const existingUser = await User.findById(userId);
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prepare update object
        const updateData = { googleId };
        
        // Update avatar only if picture is provided and current avatar is default (dicebear)
        if (picture && existingUser.avatar && existingUser.avatar.includes('dicebear')) {
            updateData.avatar = picture;
        }

        // Update user with googleId (and optionally avatar)
        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        );

        // Generate JWT token
        const jwtToken = generateToken(user._id);

        res.json({
            status: 'success',
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            bio: user.bio,
            kidsMode: user.kidsMode,
            token: jwtToken,
            message: 'Google account linked successfully'
        });
    } catch (error) {
        console.error('Confirm link error:', error);
        res.status(500).json({ message: 'Server error confirming account link' });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('followers', 'username avatar')
            .populate('following', 'username avatar');

        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            bio: user.bio,
            kidsMode: user.kidsMode,
            followers: user.followers,
            following: user.following,
            followerCount: user.followers.length,
            followingCount: user.following.length
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error fetching profile' });
    }
});

export default router;
