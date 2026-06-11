import { prisma } from "@/lib/prisma";
import type { Plan } from "@prisma/client";

export interface CreateUserInput {
  clerkId: string;
  email: string;
  name?: string;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  plan?: Plan;
}

export async function getUserByClerkId(clerkId: string) {
  return prisma.user.findUnique({
    where: { clerkId },
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
    where: { clerkId: data.clerkId },
  });

  if (existing) {
    return existing;
  }

  return prisma.user.create({
    data: {
      clerkId: data.clerkId,
      email: data.email,
      name: data.name,
    },
  });
}

export async function updateUser(clerkId: string, data: UpdateUserInput) {
  return prisma.user.update({
    where: { clerkId },
    data,
  });
}

export async function deleteUser(clerkId: string) {
  return prisma.user.delete({
    where: { clerkId },
  });
}
