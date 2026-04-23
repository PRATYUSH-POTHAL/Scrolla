import 'dotenv/config';
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const tlsConfig = redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined;
const redisOptions = {
  retryStrategy: (times) => Math.min(times * 100, 3000),
  enableOfflineQueue: false,
  ...(tlsConfig && { tls: tlsConfig })
};
export const publisher  = new Redis(redisUrl, redisOptions);
export const subscriber = new Redis(redisUrl, redisOptions);

publisher.on('error',  (err) => console.error('Redis publisher error (non-fatal):', err.message || err));
subscriber.on('error', (err) => console.error('Redis subscriber error (non-fatal):', err.message || err));

export const CHANNELS = {
  POST_CREATED: 'post:created',
  POST_DELETED: 'post:deleted',
  USER_UPDATED: 'user:updated',
};
