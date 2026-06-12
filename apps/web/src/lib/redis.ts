/**
 * Redis client abstraction.
 *
 * - Production: Uses Upstash Redis (set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
 * - Local dev: Falls back to in-memory store (rate limits enforced but reset on restart)
 *
 * To switch to production: just set the two env vars. Zero code changes.
 */

// ─── In-Memory Store (local dev fallback) ─────────────────────────────────────

class MemoryStore {
  private store = new Map<string, { value: unknown; expiresAt: number | null }>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  async incr(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (entry && (entry.expiresAt === null || Date.now() < entry.expiresAt)) {
      entry.value = ((entry.value as number) || 0) + 1;
      return entry.value as number;
    }
    this.store.set(key, { value: 1, expiresAt: null });
    return 1;
  }

  async expire(key: string, seconds: number): Promise<void> {
    const entry = this.store.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + seconds * 1000;
      this.setAutoCleanup(key, seconds);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set(key: string, value: unknown, opts?: { ex?: number }): Promise<void> {
    const expiresAt = opts?.ex ? Date.now() + opts.ex * 1000 : null;
    this.store.set(key, { value, expiresAt });
    if (opts?.ex) this.setAutoCleanup(key, opts.ex);
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  private setAutoCleanup(key: string, seconds: number): void {
    if (!this.timers.has(key)) {
      this.timers.set(
        key,
        setTimeout(() => {
          this.store.delete(key);
          this.timers.delete(key);
        }, seconds * 1000)
      );
    }
  }
}

// ─── Upstash Redis Client ─────────────────────────────────────────────────────

interface RedisLike {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, opts?: { ex?: number }): Promise<void>;
  del(key: string): Promise<void>;
}

let _redis: RedisLike | null = null;

function createRedisClient(): RedisLike {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    // Production: use Upstash Redis
    // Dynamic import to avoid webpack bundling issues
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Redis } = require("@upstash/redis") as typeof import("@upstash/redis");
      const client = new Redis({ url: upstashUrl, token: upstashToken });
      return {
        incr: (key: string) => client.incr(key) as Promise<number>,
        expire: (key: string, seconds: number) => client.expire(key, seconds) as unknown as Promise<void>,
        get: <T>(key: string) => client.get(key) as Promise<T | null>,
        set: (key: string, value: unknown, opts?: { ex?: number }) =>
          client.set(key, value, opts as Record<string, unknown>) as unknown as Promise<void>,
        del: (key: string) => client.del(key) as unknown as Promise<void>,
      };
    } catch {
      // Fallback to in-memory if Upstash SDK fails
      console.warn("[Redis] Upstash SDK failed, falling back to in-memory store");
      return new MemoryStore();
    }
  }

  // Local dev: use in-memory store
  console.log("[Redis] No UPSTASH_REDIS_REST_URL set, using in-memory store");
  return new MemoryStore();
}

export function getRedis(): RedisLike {
  if (!_redis) {
    _redis = createRedisClient();
  }
  return _redis;
}

// Backward-compatible export
export const redis = {
  incr: (key: string) => getRedis().incr(key),
  expire: (key: string, seconds: number) => getRedis().expire(key, seconds),
};

// Cache helpers
const CACHE_TTL = 300; // 5 minutes

export async function cacheGet<T>(key: string): Promise<T | null> {
  return getRedis().get<T>(key);
}

export async function cacheSet(key: string, value: unknown, ttl: number = CACHE_TTL): Promise<void> {
  return getRedis().set(key, value, { ex: ttl });
}

export async function cacheDel(key: string): Promise<void> {
  return getRedis().del(key);
}
