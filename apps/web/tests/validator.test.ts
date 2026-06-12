import { describe, it, expect } from "vitest";
import {
  emailSchema,
  verifyEmailSchema,
  createApiKeySchema,
  createWebhookSchema,
  usageQuerySchema,
  paginationSchema,
} from "@/lib/validator";

describe("emailSchema", () => {
  it("accepts valid email", () => {
    expect(emailSchema.safeParse("user@example.com").success).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
  });

  it("rejects email without domain", () => {
    expect(emailSchema.safeParse("user@").success).toBe(false);
  });

  it("rejects email without local part", () => {
    expect(emailSchema.safeParse("@example.com").success).toBe(false);
  });

  it("rejects email longer than 254 characters", () => {
    const longEmail = "a".repeat(250) + "@test.com";
    expect(emailSchema.safeParse(longEmail).success).toBe(false);
  });
});

describe("verifyEmailSchema", () => {
  it("accepts valid email", () => {
    const result = verifyEmailSchema.safeParse({ email: "user@example.com" });
    expect(result.success).toBe(true);
  });

  it("accepts email with context", () => {
    const result = verifyEmailSchema.safeParse({
      email: "user@example.com",
      context: {
        ip_address: "192.168.1.1",
        user_agent: "Mozilla/5.0",
        country_code: "US",
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid IP in context", () => {
    const result = verifyEmailSchema.safeParse({
      email: "user@example.com",
      context: { ip_address: "not-an-ip" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid country code", () => {
    const result = verifyEmailSchema.safeParse({
      email: "user@example.com",
      context: { country_code: "USA" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    expect(verifyEmailSchema.safeParse({}).success).toBe(false);
  });
});

describe("createApiKeySchema", () => {
  it("accepts valid input", () => {
    const result = createApiKeySchema.safeParse({ name: "Production" });
    expect(result.success).toBe(true);
  });

  it("accepts with permissions", () => {
    const result = createApiKeySchema.safeParse({
      name: "Test",
      permissions: ["verify", "admin"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(createApiKeySchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("rejects name longer than 100", () => {
    expect(
      createApiKeySchema.safeParse({ name: "a".repeat(101) }).success
    ).toBe(false);
  });

  it("rejects invalid permissions", () => {
    expect(
      createApiKeySchema.safeParse({ name: "Test", permissions: ["invalid"] })
        .success
    ).toBe(false);
  });
});

describe("createWebhookSchema", () => {
  it("accepts valid webhook", () => {
    const result = createWebhookSchema.safeParse({
      url: "https://example.com/webhook",
      events: ["email.blocked"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects HTTP URL", () => {
    expect(
      createWebhookSchema.safeParse({
        url: "http://example.com/webhook",
        events: ["email.blocked"],
      }).success
    ).toBe(false);
  });

  it("rejects empty events", () => {
    expect(
      createWebhookSchema.safeParse({
        url: "https://example.com/webhook",
        events: [],
      }).success
    ).toBe(false);
  });

  it("rejects invalid event type", () => {
    expect(
      createWebhookSchema.safeParse({
        url: "https://example.com/webhook",
        events: ["invalid.event"],
      }).success
    ).toBe(false);
  });
});

describe("usageQuerySchema", () => {
  it("accepts valid period", () => {
    expect(usageQuerySchema.safeParse({ period: "7d" }).success).toBe(true);
    expect(usageQuerySchema.safeParse({ period: "30d" }).success).toBe(true);
    expect(usageQuerySchema.safeParse({ period: "90d" }).success).toBe(true);
  });

  it("rejects invalid period", () => {
    expect(usageQuerySchema.safeParse({ period: "1d" }).success).toBe(false);
  });

  it("accepts empty object", () => {
    const result = usageQuerySchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("paginationSchema", () => {
  it("accepts valid pagination", () => {
    expect(paginationSchema.safeParse({ page: 1, limit: 20 }).success).toBe(
      true
    );
  });

  it("accepts empty object", () => {
    const result = paginationSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects page 0", () => {
    expect(paginationSchema.safeParse({ page: 0 }).success).toBe(false);
  });

  it("rejects limit > 100", () => {
    expect(paginationSchema.safeParse({ limit: 101 }).success).toBe(false);
  });
});
