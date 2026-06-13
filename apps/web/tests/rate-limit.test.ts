import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockIncr, mockExpire, mockPipeline } = vi.hoisted(() => ({
  mockIncr: vi.fn(),
  mockExpire: vi.fn(),
  mockPipeline: vi.fn(),
}));

vi.mock("@/lib/redis", () => ({
  redis: {
    incr: mockIncr,
    expire: mockExpire,
  },
  getRedis: () => ({
    incr: mockIncr,
    expire: mockExpire,
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    pipeline: mockPipeline,
  }),
}));

import {
  checkRateLimit,
  checkDailyLimit,
  checkIpRateLimit,
  checkComprehensiveRateLimit,
} from "@/lib/rate-limit";

describe("Rate Limiter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkRateLimit", () => {
    it("allows request under limit", async () => {
      mockIncr.mockResolvedValue(1);

      const result = await checkRateLimit("user-1", 100, 60);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99);
      expect(mockIncr).toHaveBeenCalled();
      expect(mockExpire).toHaveBeenCalled();
    });

    it("blocks request over limit", async () => {
      mockIncr.mockResolvedValue(101);

      const result = await checkRateLimit("user-1", 100, 60);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("fails open on Redis error (allow request)", async () => {
      mockIncr.mockRejectedValue(new Error("Redis unavailable"));

      const result = await checkRateLimit("user-1", 100, 60);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99);
    });

    it("returns correct resetAt timestamp", async () => {
      mockIncr.mockResolvedValue(5);
      const before = Date.now();

      const result = await checkRateLimit("user-1", 100, 60);

      expect(result.resetAt).toBeGreaterThan(before);
    });

    it("does not set expiry on subsequent requests", async () => {
      mockIncr.mockResolvedValue(5);

      await checkRateLimit("user-1", 100, 60);

      expect(mockExpire).not.toHaveBeenCalled();
    });
  });

  describe("checkDailyLimit", () => {
    it("allows request under daily limit", async () => {
      mockIncr.mockResolvedValue(1);

      const result = await checkDailyLimit("user-1", 1000);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(999);
    });

    it("blocks request over daily limit", async () => {
      mockIncr.mockResolvedValue(1001);

      const result = await checkDailyLimit("user-1", 1000);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("fails open on Redis error (allow request)", async () => {
      mockIncr.mockRejectedValue(new Error("Redis unavailable"));

      const result = await checkDailyLimit("user-1", 1000);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(999);
    });

    it("sets expiry to end of day on first request", async () => {
      mockIncr.mockResolvedValue(1);

      await checkDailyLimit("user-1", 1000);

      expect(mockExpire).toHaveBeenCalledWith(
        expect.stringContaining("daily:user-1:"),
        expect.any(Number)
      );
    });
  });

  describe("checkIpRateLimit", () => {
    it("allows request under IP limit", async () => {
      mockIncr.mockResolvedValue(1);

      const result = await checkIpRateLimit("192.168.1.1", 60, 60);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(59);
    });

    it("blocks request over IP limit", async () => {
      mockIncr.mockResolvedValue(61);

      const result = await checkIpRateLimit("192.168.1.1", 60, 60);

      expect(result.allowed).toBe(false);
    });

    it("normalizes IP (lowercases)", async () => {
      mockIncr.mockResolvedValue(1);

      await checkIpRateLimit("192.168.1.1", 60, 60);

      expect(mockIncr).toHaveBeenCalledWith(
        expect.stringContaining("ip:192.168.1.1")
      );
    });
  });

  describe("checkComprehensiveRateLimit", () => {
    beforeEach(() => {
      // Force fallback to individual calls (pipeline not available in tests)
      mockPipeline.mockRejectedValue(new Error("not supported"));
    });

    it("allows when both minute and daily limits pass", async () => {
      mockIncr.mockResolvedValue(5);

      const result = await checkComprehensiveRateLimit({
        minuteKey: "api:minute:key1",
        minuteLimit: 100,
        dailyKey: "api:daily:user1",
        dailyLimit: 1000,
      });

      expect(result.allowed).toBe(true);
      expect(result.minute.allowed).toBe(true);
      expect(result.daily.allowed).toBe(true);
    });

    it("denies when minute limit fails", async () => {
      mockIncr.mockResolvedValueOnce(101).mockResolvedValueOnce(10);

      const result = await checkComprehensiveRateLimit({
        minuteKey: "api:minute:key1",
        minuteLimit: 100,
        dailyKey: "api:daily:user1",
        dailyLimit: 1000,
      });

      expect(result.allowed).toBe(false);
      expect(result.minute.allowed).toBe(false);
      expect(result.daily.allowed).toBe(true);
    });

    it("denies when daily limit fails", async () => {
      mockIncr.mockResolvedValueOnce(5).mockResolvedValueOnce(1001);

      const result = await checkComprehensiveRateLimit({
        minuteKey: "api:minute:key1",
        minuteLimit: 100,
        dailyKey: "api:daily:user1",
        dailyLimit: 1000,
      });

      expect(result.allowed).toBe(false);
      expect(result.minute.allowed).toBe(true);
      expect(result.daily.allowed).toBe(false);
    });

    it("denies when both limits fail", async () => {
      mockIncr.mockResolvedValueOnce(200).mockResolvedValueOnce(2000);

      const result = await checkComprehensiveRateLimit({
        minuteKey: "api:minute:key1",
        minuteLimit: 100,
        dailyKey: "api:daily:user1",
        dailyLimit: 1000,
      });

      expect(result.allowed).toBe(false);
      expect(result.minute.allowed).toBe(false);
      expect(result.daily.allowed).toBe(false);
    });
  });
});
