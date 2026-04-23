import 'dotenv/config';
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const tlsConfig = redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined;
const redis = new Redis(redisUrl, {
  retryStrategy: (times) => Math.min(times * 100, 3000),
  enableOfflineQueue: false,
  lazyConnect: true,
  ...(tlsConfig && { tls: tlsConfig })
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('⚠️ Redis error (non-fatal):', err.message || err));

// We don't await redis.connect() here to prevent blocking server startup.
// ioredis will attempt to connect in the background when lazyConnect is false,
// or on first command when lazyConnect is true. 
// With enableOfflineQueue: false, commands will immediately fail (and fallback gracefully) if Redis is down.

export default redis;
