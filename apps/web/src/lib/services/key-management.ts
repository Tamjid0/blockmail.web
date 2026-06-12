// ============================================
// Zuplo-Aware Key Management Service
// ============================================
// abstracts key management across Zuplo (production) and self-managed (dev/self-hosted)

import {
  createConsumer,
  getConsumer,
  listKeys,
  createKey,
  rollKey,
  deleteKey,
  deleteConsumer,
  isZuploConfigured,
  type ZuploApiKey,
} from "@/lib/zuplo";
import {
  createApiKey as createSelfManagedKey,
  getApiKeys as getSelfManagedKeys,
  revokeApiKey as revokeSelfManagedKey,
  getApiKeyByPrefix,
} from "@/lib/services/apikey";
import { prisma } from "@/lib/prisma";

// ============================================
// Types
// ============================================

export interface ApiKeyResult {
  id: string;
  name: string;
  key?: string;
  keyPrefix: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
  rateLimit?: number;
  dailyLimit?: number;
}

export interface CreateKeyResult {
  success: boolean;
  key?: string;
  consumerId?: string;
  error?: string;
}

// ============================================
// Zuplo Operations
// ============================================

async function createZuploKey(
  userId: string,
  name: string,
  plan: string
): Promise<CreateKeyResult> {
  console.log("[KeyManagement] Creating Zuplo key for user:", userId);

  const result = await createConsumer({
    name: userId,
    description: name,
    metadata: { plan, userId },
    tags: { userId, externalId: userId },
  });

  if (!result) {
    console.error("[KeyManagement] Failed to create Zuplo consumer");
    return { success: false, error: "Failed to create Zuplo consumer" };
  }

  console.log("[KeyManagement] Zuplo consumer created:", result.consumer.id);

  // The new Zuplo key — use keyId if available (new key), else fall back to consumer ID
  const zuploKeyId = result.keyId || result.consumer.apiKeys?.[0]?.id || result.consumer.id;

  // Store each key individually in our DB
  await prisma.apiKey.create({
    data: {
      userId,
      unkeyId: zuploKeyId,
      name,
      keyPrefix: result.key.substring(0, 11),
      permissions: ["verify"],
      rateLimit: 100,
      dailyLimit: 1000,
    },
  });

  return {
    success: true,
    key: result.key,
    consumerId: result.consumer.id,
  };
}

async function listZuploKeys(userId: string): Promise<ApiKeyResult[]> {
  const consumer = await getConsumer(userId);
  if (!consumer) return [];

  const plan = (consumer.metadata?.plan as string) ?? "FREE";

  // Read individual key names from our DB (matched by Zuplo key ID)
  const dbRecords = await prisma.apiKey.findMany({
    where: { userId },
    select: { unkeyId: true, name: true },
  });
  const nameById = new Map(dbRecords.map((r) => [r.unkeyId, r.name]));

  return consumer.apiKeys.map((k: ZuploApiKey) => ({
    id: k.id,
    name: nameById.get(k.id) || "API Key",
    keyPrefix: k.key?.substring(0, 11) ?? "zpka_...",
    isActive: !k.expiresOn || new Date(k.expiresOn) > new Date(),
    createdAt: k.createdOn,
    lastUsedAt: null,
    rateLimit: plan === "PRO" ? 100 : 10,
    dailyLimit: plan === "PRO" ? 1000 : 100,
  }));
}

async function revokeZuploKey(
  userId: string,
  keyId: string
): Promise<boolean> {
  const consumer = await getConsumer(userId);
  if (!consumer) return false;

  return deleteKey(consumer.name, keyId);
}

// ============================================
// Self-Managed Operations
// ============================================

async function createSelfManaged(
  userId: string,
  name: string
): Promise<CreateKeyResult> {
  const result = await createSelfManagedKey({
    userId,
    name,
    permissions: ["verify"],
    rateLimit: 100,
    dailyLimit: 1000,
  });

  return {
    success: true,
    key: result.key,
    consumerId: result.id,
  };
}

async function listSelfManaged(userId: string): Promise<ApiKeyResult[]> {
  const keys = await getSelfManagedKeys(userId);
  return keys.map((k) => ({
    id: k.id,
    name: k.name,
    keyPrefix: k.keyPrefix,
    isActive: k.isActive,
    createdAt: k.createdAt.toISOString(),
    lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
    rateLimit: k.rateLimit,
    dailyLimit: k.dailyLimit,
  }));
}

async function revokeSelfManaged(keyId: string): Promise<boolean> {
  try {
    await revokeSelfManagedKey(keyId);
    return true;
  } catch {
    return false;
  }
}

// ============================================
// Unified API
// ============================================

export async function createApiKey(
  userId: string,
  name: string,
  plan: string = "FREE"
): Promise<CreateKeyResult> {
  if (isZuploConfigured()) {
    return createZuploKey(userId, name, plan);
  }
  return createSelfManaged(userId, name);
}

export async function getApiKeys(userId: string): Promise<ApiKeyResult[]> {
  if (isZuploConfigured()) {
    return listZuploKeys(userId);
  }
  return listSelfManaged(userId);
}

export async function revokeApiKey(
  userId: string,
  keyId: string
): Promise<boolean> {
  if (isZuploConfigured()) {
    return revokeZuploKey(userId, keyId);
  }
  return revokeSelfManaged(keyId);
}
