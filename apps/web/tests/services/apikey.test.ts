import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    apiKey: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { getApiKeys, getApiKeyById, createApiKey, revokeApiKey, deleteApiKey, getApiKeyByPrefix, updateLastUsedAt } from "@/lib/services/apikey";

const mockPrisma = vi.mocked(prisma);

describe("API Key Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getApiKeys", () => {
    it("returns all keys for a user", async () => {
      const mockKeys = [{ id: "1", name: "Test Key" }];
      mockPrisma.apiKey.findMany.mockResolvedValue(mockKeys as never);

      const result = await getApiKeys("user-1");

      expect(result).toEqual(mockKeys);
      expect(mockPrisma.apiKey.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        orderBy: { createdAt: "desc" },
        select: expect.any(Object),
      });
    });
  });

  describe("getApiKeyById", () => {
    it("returns key by id", async () => {
      const mockKey = { id: "1", name: "Test Key" };
      mockPrisma.apiKey.findUnique.mockResolvedValue(mockKey as never);

      const result = await getApiKeyById("1");

      expect(result).toEqual(mockKey);
    });

    it("returns null for non-existent key", async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue(null);

      const result = await getApiKeyById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("createApiKey", () => {
    it("creates a new API key with generated hash", async () => {
      const created = { id: "1", name: "Test Key", keyPrefix: "bm_live_abc" };
      mockPrisma.apiKey.create.mockResolvedValue(created as never);

      const result = await createApiKey({ userId: "user-1", name: "Test Key" });

      expect(result.name).toBe("Test Key");
      expect(result.key).toMatch(/^bm_live_/);
      expect(result.keyPrefix).toMatch(/^bm_live_/);
      expect(mockPrisma.apiKey.create).toHaveBeenCalled();
    });

    it("uses custom permissions and limits", async () => {
      mockPrisma.apiKey.create.mockResolvedValue({ id: "1" } as never);

      await createApiKey({
        userId: "user-1",
        name: "Custom Key",
        permissions: ["verify", "admin"],
        rateLimit: 500,
        dailyLimit: 5000,
      });

      expect(mockPrisma.apiKey.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          permissions: ["verify", "admin"],
          rateLimit: 500,
          dailyLimit: 5000,
        }),
        select: expect.any(Object),
      });
    });
  });

  describe("revokeApiKey", () => {
    it("sets key to inactive", async () => {
      mockPrisma.apiKey.update.mockResolvedValue({ id: "1", isActive: false } as never);

      await revokeApiKey("1");

      expect(mockPrisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: "1" },
        data: { isActive: false },
      });
    });
  });

  describe("deleteApiKey", () => {
    it("deletes key by id", async () => {
      mockPrisma.apiKey.delete.mockResolvedValue({} as never);

      await deleteApiKey("1");

      expect(mockPrisma.apiKey.delete).toHaveBeenCalledWith({ where: { id: "1" } });
    });
  });

  describe("getApiKeyByPrefix", () => {
    it("returns active key with user", async () => {
      const mockKey = { id: "1", user: { id: "user-1" } };
      mockPrisma.apiKey.findFirst.mockResolvedValue(mockKey as never);

      const result = await getApiKeyByPrefix("bm_live_abc");

      expect(result).toEqual(mockKey);
      expect(mockPrisma.apiKey.findFirst).toHaveBeenCalledWith({
        where: { keyPrefix: "bm_live_abc", isActive: true },
        include: { user: true },
      });
    });
  });

  describe("updateLastUsedAt", () => {
    it("updates lastUsedAt timestamp", async () => {
      mockPrisma.apiKey.update.mockResolvedValue({} as never);

      await updateLastUsedAt("1");

      expect(mockPrisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: "1" },
        data: { lastUsedAt: expect.any(Date) },
      });
    });
  });
});
