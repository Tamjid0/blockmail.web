import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuditActions } from "@/lib/audit";

const mockCreate = vi.hoisted(() => vi.fn().mockResolvedValue({}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    auditLog: { create: mockCreate },
  },
}));

const { logAudit } = await import("@/lib/audit");

describe("Audit Logging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs an audit entry to database", () => {
    logAudit({
      action: AuditActions.API_KEY_USED,
      userId: "user_123",
      apiKeyId: "key_456",
      ip: "127.0.0.1",
      severity: "info",
    });

    expect(mockCreate).toHaveBeenCalledOnce();
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        action: "api_key.used",
        severity: "info",
        userId: "user_123",
        apiKeyId: "key_456",
        ip: "127.0.0.1",
        details: undefined,
      },
    });
  });

  it("logs warning entries", () => {
    logAudit({
      action: AuditActions.RATE_LIMIT_HIT,
      userId: "user_123",
      severity: "warn",
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ severity: "warn" }),
    });
  });

  it("logs error entries with details", () => {
    logAudit({
      action: AuditActions.WEBHOOK_FAILED,
      severity: "error",
      details: { url: "https://example.com", error: "timeout" },
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        severity: "error",
        details: { url: "https://example.com", error: "timeout" },
      }),
    });
  });

  it("handles null userId and apiKeyId", () => {
    logAudit({
      action: "test.action",
      severity: "info",
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: null,
        apiKeyId: null,
      }),
    });
  });

  it("does not throw on database failure", () => {
    mockCreate.mockRejectedValueOnce(new Error("DB error"));

    expect(() => {
      logAudit({ action: "test", severity: "info" });
    }).not.toThrow();
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
