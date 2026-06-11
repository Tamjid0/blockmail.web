export interface AuditLogEntry {
  timestamp: string;
  action: string;
  userId?: string;
  apiKeyId?: string;
  ip?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  severity: "info" | "warn" | "error";
}

const auditLog: AuditLogEntry[] = [];

export function logAudit(entry: Omit<AuditLogEntry, "timestamp">): void {
  const logEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  // In-memory store (production would use a logging service)
  auditLog.push(logEntry);

  // Keep only last 1000 entries in memory
  if (auditLog.length > 1000) {
    auditLog.shift();
  }

  // Console output for development
  const prefix = logEntry.severity === "error" ? "🔴" : logEntry.severity === "warn" ? "🟡" : "🟢";
  console.log(`${prefix} [AUDIT] ${logEntry.action} | user=${logEntry.userId ?? "N/A"} | key=${logEntry.apiKeyId ?? "N/A"} | ip=${logEntry.ip ?? "N/A"}`);
}

export function getAuditLogs(limit: number = 100): AuditLogEntry[] {
  return auditLog.slice(-limit);
}

export function clearAuditLogs(): void {
  auditLog.length = 0;
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
