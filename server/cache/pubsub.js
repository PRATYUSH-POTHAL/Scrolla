import 'dotenv/config';
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
export const publisher  = new Redis(redisUrl);
export const subscriber = new Redis(redisUrl);

publisher.on('error',  (err) => console.error('Redis publisher error (non-fatal):', err.message));
subscriber.on('error', (err) => console.error('Redis subscriber error (non-fatal):', err.message));

export const CHANNELS = {
  POST_CREATED: 'post:created',
  POST_DELETED: 'post:deleted',
  USER_UPDATED: 'user:updated',
};
