import rateLimit from 'express-rate-limit';

// General rate limit: 100 requests per minute per IP
export const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: { message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});

// Strict rate limit for auth endpoints: 10 attempts per 15 minutes per IP
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false
});
