import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    webhook: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { getWebhooks, getWebhookById, createWebhook, deleteWebhook, toggleWebhook, incrementFailureCount, resetFailureCount, getActiveWebhooksForEvent } from "@/lib/services/webhook";

const mockPrisma = vi.mocked(prisma);

describe("Webhook Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getWebhooks", () => {
    it("returns all webhooks for a user", async () => {
      const mockWebhooks = [{ id: "1", url: "https://example.com" }];
      mockPrisma.webhook.findMany.mockResolvedValue(mockWebhooks as never);

      const result = await getWebhooks("user-1");

      expect(result).toEqual(mockWebhooks);
      expect(mockPrisma.webhook.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        orderBy: { createdAt: "desc" },
        select: expect.any(Object),
      });
    });
  });

  describe("getWebhookById", () => {
    it("returns webhook by id", async () => {
      const mockWebhook = { id: "1", url: "https://example.com" };
      mockPrisma.webhook.findUnique.mockResolvedValue(mockWebhook as never);

      const result = await getWebhookById("1");

      expect(result).toEqual(mockWebhook);
    });
  });

  describe("createWebhook", () => {
    it("creates webhook with generated secret", async () => {
      const created = { id: "1", url: "https://example.com", events: ["email.blocked"] };
      mockPrisma.webhook.create.mockResolvedValue(created as never);

      const result = await createWebhook({ userId: "user-1", url: "https://example.com", events: ["email.blocked"] });

      expect(result.url).toBe("https://example.com");
      expect(result.secret).toMatch(/^whsec_/);
      expect(mockPrisma.webhook.create).toHaveBeenCalled();
    });
  });

  describe("deleteWebhook", () => {
    it("deletes webhook by id", async () => {
      mockPrisma.webhook.delete.mockResolvedValue({} as never);

      await deleteWebhook("1");

      expect(mockPrisma.webhook.delete).toHaveBeenCalledWith({ where: { id: "1" } });
    });
  });

  describe("toggleWebhook", () => {
    it("toggles webhook active state", async () => {
      mockPrisma.webhook.update.mockResolvedValue({ id: "1", isActive: false } as never);

      await toggleWebhook("1", false);

      expect(mockPrisma.webhook.update).toHaveBeenCalledWith({
        where: { id: "1" },
        data: { isActive: false },
      });
    });
  });

  describe("incrementFailureCount", () => {
    it("increments failure count", async () => {
      mockPrisma.webhook.update.mockResolvedValue({} as never);

      await incrementFailureCount("1");

      expect(mockPrisma.webhook.update).toHaveBeenCalledWith({
        where: { id: "1" },
        data: { failureCount: { increment: 1 } },
      });
    });
  });

  describe("resetFailureCount", () => {
    it("resets failure count and sets lastTriggeredAt", async () => {
      mockPrisma.webhook.update.mockResolvedValue({} as never);

      await resetFailureCount("1");

      expect(mockPrisma.webhook.update).toHaveBeenCalledWith({
        where: { id: "1" },
        data: { failureCount: 0, lastTriggeredAt: expect.any(Date) },
      });
    });
  });

  describe("getActiveWebhooksForEvent", () => {
    it("returns active webhooks matching event", async () => {
      const mockWebhooks = [{ id: "1", url: "https://example.com", secret: "whsec_abc" }];
      mockPrisma.webhook.findMany.mockResolvedValue(mockWebhooks as never);

      const result = await getActiveWebhooksForEvent("user-1", "email.blocked");

      expect(result).toEqual(mockWebhooks);
      expect(mockPrisma.webhook.findMany).toHaveBeenCalledWith({
        where: {
          userId: "user-1",
          isActive: true,
          events: { has: "email.blocked" },
        },
        select: { id: true, url: true, secret: true, events: true },
      });
    });
  });
});
