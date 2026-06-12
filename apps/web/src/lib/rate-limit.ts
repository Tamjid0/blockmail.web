import { redis } from "@/lib/redis";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

interface DailyLimitResult {
  allowed: boolean;
  remaining: number;
}

/**
 * Sliding window rate limiter using Redis INCR + EXPIRE.
 * Fail-open: if Redis is unavailable, allow the request.
 * Rate limiting is defense-in-depth — API key auth + plan limits are the real security.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  try {
    const now = Date.now();
    const windowStart = Math.floor(now / (windowSeconds * 1000));
    const redisKey = `rl:${key}:${windowStart}`;
    const resetAt = (windowStart + 1) * windowSeconds * 1000;

    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.expire(redisKey, windowSeconds);
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
 * Fail-open: if Redis is unavailable, allow the request.
 */
export async function checkDailyLimit(
  key: string,
  limit: number
): Promise<DailyLimitResult> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const redisKey = `daily:${key}:${today}`;

    const count = await redis.incr(redisKey);
    if (count === 1) {
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

/**
 * IP-based rate limiter for edge middleware.
 * Fail-open: if Redis is unavailable, allow the request.
 */
export async function checkIpRateLimit(
  ip: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const normalizedIp = ip.toLowerCase().trim();
  return checkRateLimit(`ip:${normalizedIp}`, limit, windowSeconds);
}

/**
 * Check both per-minute and daily rate limits in one call.
 * Returns the first failed limit, or both results if both pass.
 */
export async function checkComprehensiveRateLimit(opts: {
  minuteKey: string;
  minuteLimit: number;
  dailyKey: string;
  dailyLimit: number;
  windowSeconds?: number;
}): Promise<{
  allowed: boolean;
  minute: RateLimitResult;
  daily: DailyLimitResult;
}> {
  const windowSeconds = opts.windowSeconds ?? 60;

  const [minute, daily] = await Promise.all([
    checkRateLimit(opts.minuteKey, opts.minuteLimit, windowSeconds),
    checkDailyLimit(opts.dailyKey, opts.dailyLimit),
  ]);

  return {
    allowed: minute.allowed && daily.allowed,
    minute,
    daily,
  };
}
