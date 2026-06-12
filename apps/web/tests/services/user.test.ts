import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { getUserBySupabaseId, getUserById, createUser, updateUser, deleteUser } from "@/lib/services/user";

const mockPrisma = vi.mocked(prisma);

describe("User Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserBySupabaseId", () => {
    it("returns user with apiKeys and webhooks", async () => {
      const mockUser = { id: "1", supabaseId: "supabase-1", apiKeys: [], webhooks: [] };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as never);

      const result = await getUserBySupabaseId("supabase-1");

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { supabaseId: "supabase-1" },
        include: {
          apiKeys: { select: expect.any(Object) },
          webhooks: { select: expect.any(Object) },
        },
      });
    });

    it("returns null for non-existent user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await getUserBySupabaseId("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("getUserById", () => {
    it("returns user by id", async () => {
      const mockUser = { id: "1", supabaseId: "supabase-1" };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as never);

      const result = await getUserById("1");

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: "1" } });
    });
  });

  describe("createUser", () => {
    it("creates a new user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const created = { id: "1", supabaseId: "supabase-1", email: "test@test.com", name: "Test" };
      mockPrisma.user.create.mockResolvedValue(created as never);

      const result = await createUser({ supabaseId: "supabase-1", email: "test@test.com", name: "Test" });

      expect(result).toEqual(created);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: { supabaseId: "supabase-1", email: "test@test.com", name: "Test" },
      });
    });

    it("returns existing user if already exists", async () => {
      const existing = { id: "1", supabaseId: "supabase-1" };
      mockPrisma.user.findUnique.mockResolvedValue(existing as never);

      const result = await createUser({ supabaseId: "supabase-1", email: "test@test.com" });

      expect(result).toEqual(existing);
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe("updateUser", () => {
    it("updates user fields", async () => {
      const updated = { id: "1", name: "Updated" };
      mockPrisma.user.update.mockResolvedValue(updated as never);

      const result = await updateUser("supabase-1", { name: "Updated" });

      expect(result).toEqual(updated);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { supabaseId: "supabase-1" },
        data: { name: "Updated" },
      });
    });
  });

  describe("deleteUser", () => {
    it("deletes user by supabaseId", async () => {
      mockPrisma.user.delete.mockResolvedValue({} as never);

      await deleteUser("supabase-1");

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { supabaseId: "supabase-1" } });
    });
  });
});
