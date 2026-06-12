import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockIncr, mockExpire } = vi.hoisted(() => ({
  mockIncr: vi.fn(),
  mockExpire: vi.fn(),
}));

vi.mock("@/lib/redis", () => ({
  redis: {
    incr: mockIncr,
    expire: mockExpire,
  },
}));

import { checkRateLimit, checkDailyLimit } from "@/lib/rate-limit";

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

    it("fails open on Redis error", async () => {
      mockIncr.mockRejectedValue(new Error("Redis unavailable"));

      const result = await checkRateLimit("user-1", 100, 60);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99);
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

    it("fails open on Redis error", async () => {
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
});
