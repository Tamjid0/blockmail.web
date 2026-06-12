/**
 * Redis client abstraction.
 *
 * - Production: Uses Upstash Redis (set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
 * - Local dev: Falls back to in-memory store (rate limits enforced but reset on restart)
 *
 * To switch to production: just set the two env vars. Zero code changes.
 */

// ─── In-Memory Store (local dev fallback) ─────────────────────────────────────

interface MemoryEntry {
  count: number;
  expiresAt: number | null;
}

class MemoryStore {
  private store = new Map<string, MemoryEntry>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  async incr(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (entry && (entry.expiresAt === null || Date.now() < entry.expiresAt)) {
      entry.count++;
      return entry.count;
    }
    const newEntry: MemoryEntry = { count: 1, expiresAt: null };
    this.store.set(key, newEntry);
    return 1;
  }

  async expire(key: string, seconds: number): Promise<void> {
    const entry = this.store.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + seconds * 1000;
      // Auto-cleanup after expiry
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
}

// ─── Upstash Redis Client ─────────────────────────────────────────────────────

interface RedisLike {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
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
        expire: (key: string, seconds: number) => client.expire(key, seconds) as Promise<void>,
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
