import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export interface CreateWebhookInput {
  userId: string;
  url: string;
  events: string[];
}

function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(24).toString("hex")}`;
}

export async function getWebhooks(userId: string) {
  return prisma.webhook.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      url: true,
      events: true,
      isActive: true,
      lastTriggeredAt: true,
      failureCount: true,
      createdAt: true,
    },
  });
}

export async function getWebhookById(id: string) {
  return prisma.webhook.findUnique({
    where: { id },
  });
}

export async function createWebhook(input: CreateWebhookInput) {
  const secret = generateWebhookSecret();

  const webhook = await prisma.webhook.create({
    data: {
      userId: input.userId,
      url: input.url,
      events: input.events,
      secret,
    },
    select: {
      id: true,
      url: true,
      events: true,
      isActive: true,
      createdAt: true,
    },
  });

  return { ...webhook, secret };
}

export async function deleteWebhook(id: string) {
  return prisma.webhook.delete({
    where: { id },
  });
}

export async function toggleWebhook(id: string, isActive: boolean) {
  return prisma.webhook.update({
    where: { id },
    data: { isActive },
  });
}

export async function incrementFailureCount(id: string) {
  return prisma.webhook.update({
    where: { id },
    data: {
      failureCount: { increment: 1 },
    },
  });
}

export async function resetFailureCount(id: string) {
  return prisma.webhook.update({
    where: { id },
    data: {
      failureCount: 0,
      lastTriggeredAt: new Date(),
    },
  });
}

export async function getActiveWebhooksForEvent(userId: string, event: string) {
  return prisma.webhook.findMany({
    where: {
      userId,
      isActive: true,
      events: { has: event },
    },
    select: {
      id: true,
      url: true,
      secret: true,
      events: true,
    },
  });
}
