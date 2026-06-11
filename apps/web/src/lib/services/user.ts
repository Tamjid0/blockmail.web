import { prisma } from "@/lib/prisma";
import type { Plan } from "@prisma/client";

export interface CreateUserInput {
  supabaseId: string;
  email: string;
  name?: string;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  plan?: Plan;
}

export async function getUserBySupabaseId(supabaseId: string) {
  return prisma.user.findUnique({
    where: { supabaseId },
    include: {
      apiKeys: {
        select: {
          id: true,
          name: true,
          keyPrefix: true,
          permissions: true,
          rateLimit: true,
          dailyLimit: true,
          isActive: true,
          lastUsedAt: true,
          createdAt: true,
        },
      },
      webhooks: {
        select: {
          id: true,
          url: true,
          events: true,
          isActive: true,
          lastTriggeredAt: true,
          createdAt: true,
        },
      },
    },
  });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function createUser(data: CreateUserInput) {
  const existing = await prisma.user.findUnique({
    where: { supabaseId: data.supabaseId },
  });

  if (existing) {
    return existing;
  }

  return prisma.user.create({
    data: {
      supabaseId: data.supabaseId,
      email: data.email,
      name: data.name,
    },
  });
}

export async function updateUser(supabaseId: string, data: UpdateUserInput) {
  return prisma.user.update({
    where: { supabaseId },
    data,
  });
}

export async function deleteUser(supabaseId: string) {
  return prisma.user.delete({
    where: { supabaseId },
  });
}
