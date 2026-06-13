import { getRedis } from "@/lib/redis";

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
 * Single rate limit check (minute window).
 * Fail-open: if Redis is unavailable, allow the request.
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

    const count = await getRedis().incr(redisKey);
    if (count === 1) {
      await getRedis().expire(redisKey, windowSeconds);
    }

    if (count > limit) {
      return { allowed: false, remaining: 0, resetAt };
    }

    return { allowed: true, remaining: limit - count, resetAt };
  } catch {
    return { allowed: true, remaining: limit - 1, resetAt: Date.now() + 60000 };
  }
}

/**
 * Daily rate limit check. Resets at midnight UTC.
 * Fail-open: if Redis is unavailable, allow the request.
 */
export async function checkDailyLimit(
  key: string,
  limit: number
): Promise<DailyLimitResult> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const redisKey = `daily:${key}:${today}`;

    const count = await getRedis().incr(redisKey);
    if (count === 1) {
      const endOfDay = new Date();
      endOfDay.setUTCHours(23, 59, 59, 999);
      const ttlSeconds = Math.ceil((endOfDay.getTime() - Date.now()) / 1000);
      await getRedis().expire(redisKey, ttlSeconds);
    }

    if (count > limit) {
      return { allowed: false, remaining: 0 };
    }

    return { allowed: true, remaining: limit - count };
  } catch {
    return { allowed: true, remaining: limit - 1 };
  }
}

/**
 * IP-based rate limiter.
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
 * Check both per-minute and daily rate limits.
 *
 * Uses Redis pipeline (1 HTTP request for Upstash) to batch 4 commands.
 * Falls back to Lua script (local Redis) or parallel individual calls.
 * Fail-open: if Redis is unavailable, allow the request.
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
  const now = Date.now();
  const minuteWindowStart = Math.floor(now / (windowSeconds * 1000));
  const minuteResetAt = (minuteWindowStart + 1) * windowSeconds * 1000;

  const today = new Date().toISOString().split("T")[0];
  const minuteRedisKey = `rl:${opts.minuteKey}:${minuteWindowStart}`;
  const dailyRedisKey = `daily:${opts.dailyKey}:${today}`;

  const endOfDay = new Date();
  endOfDay.setUTCHours(23, 59, 59, 999);
  const dailyTtlSeconds = Math.ceil((endOfDay.getTime() - now) / 1000);

  // Try pipeline (1 HTTP request for Upstash, 1 round trip for local Redis)
  try {
    const results = await getRedis().pipeline([
      { cmd: "incr", key: minuteRedisKey },
      { cmd: "expire", key: minuteRedisKey, args: [windowSeconds] },
      { cmd: "incr", key: dailyRedisKey },
      { cmd: "expire", key: dailyRedisKey, args: [dailyTtlSeconds] },
    ]);

    if (Array.isArray(results) && results.length === 4) {
      const minuteCount = results[0] as number;
      const dailyCount = results[2] as number;
      return {
        allowed: minuteCount <= opts.minuteLimit && dailyCount <= opts.dailyLimit,
        minute: {
          allowed: minuteCount <= opts.minuteLimit,
          remaining: Math.max(0, opts.minuteLimit - minuteCount),
          resetAt: minuteResetAt,
        },
        daily: {
          allowed: dailyCount <= opts.dailyLimit,
          remaining: Math.max(0, opts.dailyLimit - dailyCount),
        },
      };
    }
  } catch {
    // Pipeline not supported — fall through to individual calls
  }

  // Fallback: parallel individual calls
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
