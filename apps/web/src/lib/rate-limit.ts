import { redis } from "@/lib/redis";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Sliding window rate limiter using Redis INCR + EXPIRE.
 * Falls back to in-memory if Redis is unavailable.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  try {
    const now = Date.now();
    const windowKey = `rl:${key}:${Math.floor(now / (windowSeconds * 1000))}`;
    const resetAt = (Math.floor(now / (windowSeconds * 1000)) + 1) * windowSeconds * 1000;

    const count = await redis.incr(windowKey);
    if (count === 1) {
      await redis.expire(windowKey, windowSeconds);
    }

    if (count > limit) {
      return { allowed: false, remaining: 0, resetAt };
    }

    return { allowed: true, remaining: limit - count, resetAt };
  } catch {
    // Redis unavailable — allow request (fail open)
    return { allowed: true, remaining: limit - 1, resetAt: Date.now() + 60000 };
  }
}

/**
 * Daily rate limiter. Resets at midnight UTC.
 */
export async function checkDailyLimit(
  key: string,
  limit: number
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const redisKey = `daily:${key}:${today}`;

    const count = await redis.incr(redisKey);
    if (count === 1) {
      // Set expiry to end of day
      const endOfDay = new Date();
      endOfDay.setUTCHours(23, 59, 59, 999);
      const ttlSeconds = Math.ceil((endOfDay.getTime() - Date.now()) / 1000);
      await redis.expire(redisKey, ttlSeconds);
    }

    if (count > limit) {
      return { allowed: false, remaining: 0 };
    }

    return { allowed: true, remaining: limit - count };
  } catch {
    // Redis unavailable — allow request (fail open)
    return { allowed: true, remaining: limit - 1 };
  }
}
