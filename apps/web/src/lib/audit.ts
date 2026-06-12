import { prisma } from "@/lib/prisma";

export interface AuditLogEntry {
  timestamp: string;
  action: string;
  userId?: string;
  apiKeyId?: string;
  ip?: string;
  details?: Record<string, unknown>;
  severity: "info" | "warn" | "error";
}

export function logAudit(entry: Omit<AuditLogEntry, "timestamp">): void {
  // Console output for development
  const prefix = entry.severity === "error" ? "🔴" : entry.severity === "warn" ? "🟡" : "🟢";
  console.log(`${prefix} [AUDIT] ${entry.action} | user=${entry.userId ?? "N/A"} | key=${entry.apiKeyId ?? "N/A"} | ip=${entry.ip ?? "N/A"}`);

  // Persist to database (fire and forget)
  prisma.auditLog.create({
    data: {
      action: entry.action,
      severity: entry.severity,
      userId: entry.userId ?? null,
      apiKeyId: entry.apiKeyId ?? null,
      ip: entry.ip ?? null,
      details: entry.details ?? undefined,
    },
  }).catch((err) => {
    console.error("[AUDIT] Failed to persist audit log:", err.message);
  });
}

export async function getAuditLogs(params: {
  userId?: string;
  limit?: number;
  offset?: number;
}) {
  const { userId, limit = 100, offset = 0 } = params;

  return prisma.auditLog.findMany({
    where: userId ? { userId } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}

// Specific audit actions
export const AuditActions = {
  API_KEY_CREATED: "api_key.created",
  API_KEY_REVOKED: "api_key.revoked",
  API_KEY_DELETED: "api_key.deleted",
  API_KEY_USED: "api_key.used",
  API_KEY_INVALID: "api_key.invalid",
  WEBHOOK_CREATED: "webhook.created",
  WEBHOOK_DELETED: "webhook.deleted",
  WEBHOOK_DELIVERED: "webhook.delivered",
  WEBHOOK_FAILED: "webhook.failed",
  RATE_LIMIT_HIT: "rate_limit.hit",
  DAILY_LIMIT_HIT: "daily_limit.hit",
  AUTH_SUCCESS: "auth.success",
  AUTH_FAILURE: "auth.failure",
} as const;
