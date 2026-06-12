import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet, cacheDel } from "@/lib/redis";

export interface CreateApiKeyInput {
  userId: string;
  name: string;
  permissions?: string[];
  rateLimit?: number;
  dailyLimit?: number;
}

function generateApiKey(): { key: string; prefix: string; hash: string } {
  const raw = `bm_live_${crypto.randomBytes(24).toString("hex")}`;
  const prefix = raw.substring(0, 11);
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { key: raw, prefix, hash };
}

export async function getApiKeys(userId: string) {
  return prisma.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
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
  });
}

export async function getApiKeyById(id: string) {
  return prisma.apiKey.findUnique({
    where: { id },
  });
}

export async function createApiKey(input: CreateApiKeyInput) {
  const { key, prefix, hash } = generateApiKey();

  const apiKey = await prisma.apiKey.create({
    data: {
      userId: input.userId,
      unkeyId: hash,
      name: input.name,
      keyPrefix: prefix,
      permissions: input.permissions ?? ["verify"],
      rateLimit: input.rateLimit ?? 100,
      dailyLimit: input.dailyLimit ?? 100,
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      permissions: true,
      rateLimit: true,
      dailyLimit: true,
      isActive: true,
      createdAt: true,
    },
  });

  return { ...apiKey, key };
}

export async function revokeApiKey(id: string) {
  const key = await prisma.apiKey.findUnique({ where: { id }, select: { keyPrefix: true } });
  const result = await prisma.apiKey.update({
    where: { id },
    data: { isActive: false },
  });
  if (key) await invalidateKeyCache(key.keyPrefix);
  return result;
}

export async function deleteApiKey(id: string) {
  const key = await prisma.apiKey.findUnique({ where: { id }, select: { keyPrefix: true } });
  const result = await prisma.apiKey.delete({
    where: { id },
  });
  if (key) await invalidateKeyCache(key.keyPrefix);
  return result;
}

const KEY_CACHE_PREFIX = "apikey:";

export async function getApiKeyByPrefix(keyPrefix: string) {
  const cacheKey = `${KEY_CACHE_PREFIX}${keyPrefix}`;
  const cached = await cacheGet<Awaited<ReturnType<typeof prisma.apiKey.findFirst>> & { user: { id: string; plan: string } }>(cacheKey);
  if (cached) return cached;

  const key = await prisma.apiKey.findFirst({
    where: { keyPrefix, isActive: true },
    include: { user: true },
  });

  if (key) {
    await cacheSet(cacheKey, key, 300);
  }

  return key;
}

export async function invalidateKeyCache(keyPrefix: string): Promise<void> {
  await cacheDel(`${KEY_CACHE_PREFIX}${keyPrefix}`);
}

export async function updateLastUsedAt(id: string) {
  return prisma.apiKey.update({
    where: { id },
    data: { lastUsedAt: new Date() },
  });
}
