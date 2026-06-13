/**
 * Redis client abstraction.
 *
 * Priority:
 *   1. Upstash Redis (set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
 *   2. Local Redis (set REDIS_URL, e.g. redis://localhost:6379)
 *   3. In-memory MemoryStore (no config needed, resets on restart)
 *
 * Switching: just change env vars. Zero code changes.
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

  async pipeline(ops: Array<{ cmd: string; key: string; args?: unknown[] }>): Promise<unknown[]> {
    const results: unknown[] = [];
    for (const op of ops) {
      switch (op.cmd) {
        case "incr":
          results.push(await this.incr(op.key));
          break;
        case "expire":
          await this.expire(op.key, (op.args?.[0] as number) ?? 0);
          results.push(1);
          break;
        default:
          results.push(null);
      }
    }
    return results;
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

// ─── Redis Interface ──────────────────────────────────────────────────────────

export interface RedisLike {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, opts?: { ex?: number }): Promise<void>;
  del(key: string): Promise<void>;
  pipeline(ops: Array<{ cmd: string; key: string; args?: unknown[] }>): Promise<unknown[]>;
}

// ─── Client Singleton ─────────────────────────────────────────────────────────

let _redis: RedisLike | null = null;

function createRedisClient(): RedisLike {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const redisUrl = process.env.REDIS_URL;

  // Priority 1: Upstash Redis
  if (upstashUrl && upstashToken) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Redis } = require("@upstash/redis") as typeof import("@upstash/redis");
      const client = new Redis({ url: upstashUrl, token: upstashToken });
      console.log("[Redis] Connected to Upstash");
      return {
        incr: (key: string) => client.incr(key) as Promise<number>,
        expire: (key: string, seconds: number) =>
          client.expire(key, seconds) as unknown as Promise<void>,
        get: <T>(key: string) => client.get(key) as Promise<T | null>,
        set: (key: string, value: unknown, opts?: { ex?: number }) =>
          client.set(key, value, opts as Record<string, unknown>) as unknown as Promise<void>,
        del: (key: string) => client.del(key) as unknown as Promise<void>,
        pipeline: async (ops: Array<{ cmd: string; key: string; args?: unknown[] }>) => {
          const p = client.pipeline();
          for (const op of ops) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const fn = (p as unknown as Record<string, (...a: any[]) => void>)[op.cmd];
            if (fn) fn.call(p, op.key, ...(op.args ?? []));
          }
          return p.exec() as Promise<unknown[]>;
        },
      };
    } catch {
      console.warn("[Redis] Upstash SDK failed, trying local Redis...");
    }
  }

  // Priority 2: Local Redis (Docker or native)
  if (redisUrl) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Redis = require("ioredis").default;
      const client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times: number) {
          if (times > 3) return null;
          return Math.min(times * 200, 1000);
        },
        lazyConnect: true,
        connectTimeout: 2000,
      });
      console.log(`[Redis] Using local Redis at ${redisUrl}`);
      return {
        incr: (key: string) => client.incr(key) as Promise<number>,
        expire: (key: string, seconds: number) =>
          client.expire(key, seconds) as Promise<void>,
        get: <T>(key: string) =>
          client.get(key).then((val: string | null) => {
            if (val === null) return null;
            try { return JSON.parse(val) as T; } catch { return val as unknown as T; }
          }),
        set: (key: string, value: unknown, opts?: { ex?: number }) => {
          if (opts?.ex) return client.set(key, JSON.stringify(value), "EX", opts.ex);
          return client.set(key, JSON.stringify(value));
        },
        del: (key: string) => client.del(key) as Promise<void>,
        pipeline: async (ops: Array<{ cmd: string; key: string; args?: unknown[] }>) => {
          const p = client.pipeline();
          for (const op of ops) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const fn = (p as unknown as Record<string, (...a: any[]) => void>)[op.cmd];
            if (fn) fn.call(p, op.key, ...(op.args ?? []));
          }
          const raw = await p.exec();
          // ioredis exec() returns [Error|null, value][] tuples — extract values
          return raw.map((pair: [Error | null, unknown]) => pair[1]);
        },
      };
    } catch {
      console.warn("[Redis] ioredis failed, falling back to in-memory store");
    }
  }

  // Priority 3: In-memory (no config)
  console.log("[Redis] Using in-memory store (no REDIS_URL or UPSTASH vars set)");
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

// ─── Cache Helpers ────────────────────────────────────────────────────────────

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
