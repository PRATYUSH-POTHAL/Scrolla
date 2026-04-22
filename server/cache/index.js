import redis from './redis.js';

export const CACHE_KEYS = {
  FEED:            (page, mood, kidSafe) => `feed:p${page}:m${mood}:k${kidSafe}`,
  USER_PROFILE:    (userId)             => `user:${userId}`,
  SUGGESTED_USERS: (userId)             => `suggested:${userId}`,
  POST:            (postId)             => `post:${postId}`,
};

export async function cacheGet(key) {
  try {
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null; // Graceful degradation: Redis down → cache miss → hits DB
  }
}

export async function cacheSet(key, value, ttlSeconds = 60) {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch { /* Non-fatal */ }
}

export async function cacheDel(key) {
  try { await redis.del(key); } catch { /* silent */ }
}

export async function cacheClear(pattern) {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
  } catch { /* silent */ }
}
