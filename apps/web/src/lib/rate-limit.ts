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
 * Lua script for atomic rate limit check (minute + daily).
 * Runs on Redis server in a single round trip.
 *
 * KEYS[1] = minute rate limit key
 * KEYS[2] = daily rate limit key
 * ARGV[1] = minute window TTL (seconds)
 * ARGV[2] = daily window TTL (seconds)
 * ARGV[3] = minute limit
 * ARGV[4] = daily limit
 *
 * Returns: [minute_count, daily_count]
 */
const RATE_LIMIT_LUA = `
local minute_key = KEYS[1]
local daily_key = KEYS[2]
local minute_ttl = tonumber(ARGV[1])
local daily_ttl = tonumber(ARGV[2])
local minute_limit = tonumber(ARGV[3])
local daily_limit = tonumber(ARGV[4])

local minute_count = redis.call('INCR', minute_key)
if minute_count == 1 then
  redis.call('EXPIRE', minute_key, minute_ttl)
end

local daily_count = redis.call('INCR', daily_key)
if daily_count == 1 then
  redis.call('EXPIRE', daily_key, daily_ttl)
end

return {minute_count, daily_count}
`;

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
 * Uses a Lua script for atomic single-round-trip execution when possible.
 * Falls back to parallel individual calls for Upstash (no Lua support).
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

  // Try Lua script (single round trip for local Redis)
  try {
    const result = (await getRedis().evalsha(
      RATE_LIMIT_LUA,
      [minuteRedisKey, dailyRedisKey],
      windowSeconds,
      dailyTtlSeconds,
      opts.minuteLimit,
      opts.dailyLimit
    )) as [number, number];

    if (Array.isArray(result) && result.length === 2) {
      const [minuteCount, dailyCount] = result;
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
    // Lua not supported (Upstash) or error — fall through to individual calls
  }

  // Fallback: parallel individual calls (for Upstash or if Lua fails)
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
