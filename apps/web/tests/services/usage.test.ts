import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockQueryRaw, mockAggregate, mockGroupBy, mockCount, mockFindMany } = vi.hoisted(() => ({
  mockQueryRaw: vi.fn().mockResolvedValue([]),
  mockAggregate: vi.fn().mockResolvedValue({ _count: { id: 0 }, _avg: { riskScore: 0 } }),
  mockGroupBy: vi.fn().mockResolvedValue([]),
  mockCount: vi.fn().mockResolvedValue(0),
  mockFindMany: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    usageLog: {
      count: mockCount,
      groupBy: mockGroupBy,
      findMany: mockFindMany,
      aggregate: mockAggregate,
    },
    $queryRaw: mockQueryRaw,
  },
}));

import { getUsageStats, getRecentUsage } from "@/lib/services/usage";

describe("Usage Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryRaw.mockResolvedValue([]);
    mockAggregate.mockResolvedValue({ _count: { id: 0 }, _avg: { riskScore: 0 } });
    mockGroupBy.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);
    mockFindMany.mockResolvedValue([]);
  });

  describe("getUsageStats", () => {
    it("returns usage stats for a period", async () => {
      mockAggregate.mockResolvedValue({
        _count: { id: 100 },
        _avg: { riskScore: 0.5 },
      });

      const result = await getUsageStats("user-1", "30d");

      expect(result.summary).toBeDefined();
      expect(result.summary.total_requests).toBe(100);
    });

    it("accepts key_id filter", async () => {
      mockAggregate.mockResolvedValue({
        _count: { id: 50 },
        _avg: { riskScore: 0.3 },
      });

      await getUsageStats("user-1", "30d", "key-1");

      expect(mockAggregate).toHaveBeenCalledWith({
        where: expect.objectContaining({ apiKeyId: "key-1" }),
        _count: { id: true },
        _avg: { riskScore: true },
      });
    });

    it("calculates by_key breakdown", async () => {
      mockAggregate.mockResolvedValue({
        _count: { id: 100 },
        _avg: { riskScore: 0.5 },
      });
      // First groupBy call is by reason, second is by apiKeyId
      mockGroupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { apiKeyId: "key-1", _count: { id: 60 } },
          { apiKeyId: "key-2", _count: { id: 40 } },
        ]);
      mockCount.mockResolvedValue(30);

      const result = await getUsageStats("user-1", "30d");

      expect(result.by_key).toBeDefined();
      expect(result.by_key).toHaveLength(2);
    });
  });

  describe("getRecentUsage", () => {
    it("returns recent usage logs", async () => {
      const mockLogs = [
        { email: "test@test.com", isDisposable: true, riskScore: 0.9, createdAt: new Date() },
      ];
      mockFindMany.mockResolvedValue(mockLogs);

      const result = await getRecentUsage("user-1", 5);

      expect(result).toEqual(mockLogs);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: expect.any(Object),
      });
    });
  });
});
