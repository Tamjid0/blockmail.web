import { describe, it, expect, beforeEach } from "vitest";
import { logAudit, getAuditLogs, clearAuditLogs, AuditActions } from "@/lib/audit";

describe("Audit Logging", () => {
  beforeEach(() => {
    clearAuditLogs();
  });

  it("logs an audit entry", () => {
    logAudit({
      action: AuditActions.API_KEY_USED,
      userId: "user_123",
      apiKeyId: "key_456",
      ip: "127.0.0.1",
      severity: "info",
    });

    const logs = getAuditLogs(10);
    expect(logs.length).toBe(1);
    expect(logs[0].action).toBe("api_key.used");
    expect(logs[0].userId).toBe("user_123");
    expect(logs[0].ip).toBe("127.0.0.1");
    expect(logs[0].timestamp).toBeDefined();
  });

  it("logs warning entries", () => {
    logAudit({
      action: AuditActions.RATE_LIMIT_HIT,
      userId: "user_123",
      severity: "warn",
    });

    const logs = getAuditLogs(10);
    expect(logs[0].severity).toBe("warn");
  });

  it("logs error entries", () => {
    logAudit({
      action: AuditActions.WEBHOOK_FAILED,
      severity: "error",
      details: { url: "https://example.com", error: "timeout" },
    });

    const logs = getAuditLogs(10);
    expect(logs[0].severity).toBe("error");
    expect(logs[0].details).toEqual({ url: "https://example.com", error: "timeout" });
  });

  it("returns logs in order", () => {
    logAudit({ action: "first", severity: "info" });
    logAudit({ action: "second", severity: "info" });
    logAudit({ action: "third", severity: "info" });

    const logs = getAuditLogs(10);
    expect(logs.length).toBe(3);
    expect(logs[0].action).toBe("first");
    expect(logs[2].action).toBe("third");
  });

  it("respects limit parameter", () => {
    for (let i = 0; i < 20; i++) {
      logAudit({ action: `action_${i}`, severity: "info" });
    }

    const logs = getAuditLogs(5);
    expect(logs.length).toBe(5);
    expect(logs[0].action).toBe("action_15");
    expect(logs[4].action).toBe("action_19");
  });
});

describe("AuditActions", () => {
  it("has all required actions", () => {
    expect(AuditActions.API_KEY_CREATED).toBe("api_key.created");
    expect(AuditActions.API_KEY_REVOKED).toBe("api_key.revoked");
    expect(AuditActions.API_KEY_USED).toBe("api_key.used");
    expect(AuditActions.API_KEY_INVALID).toBe("api_key.invalid");
    expect(AuditActions.WEBHOOK_CREATED).toBe("webhook.created");
    expect(AuditActions.WEBHOOK_DELIVERED).toBe("webhook.delivered");
    expect(AuditActions.WEBHOOK_FAILED).toBe("webhook.failed");
    expect(AuditActions.RATE_LIMIT_HIT).toBe("rate_limit.hit");
    expect(AuditActions.DAILY_LIMIT_HIT).toBe("daily_limit.hit");
    expect(AuditActions.AUTH_SUCCESS).toBe("auth.success");
    expect(AuditActions.AUTH_FAILURE).toBe("auth.failure");
  });
});
