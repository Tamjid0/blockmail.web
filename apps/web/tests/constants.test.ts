import { describe, it, expect } from "vitest";
import {
  APP_NAME,
  APP_DESCRIPTION,
  API_PREFIX,
  API_KEY_HEADER,
  API_KEY_PREFIX,
  RATE_LIMITS,
  WEBHOOK_EVENTS,
  PLAN_LIMITS,
  VERIFICATION_REASONS,
  RISK_SCORES,
} from "@/lib/constants";

describe("App Constants", () => {
  it("has correct app name", () => {
    expect(APP_NAME).toBe("Blockmail");
  });

  it("has non-empty description", () => {
    expect(APP_DESCRIPTION.length).toBeGreaterThan(0);
  });
});

describe("API Constants", () => {
  it("has correct API prefix", () => {
    expect(API_PREFIX).toBe("/api/v1");
  });

  it("has correct API key header", () => {
    expect(API_KEY_HEADER).toBe("X-API-Key");
  });

  it("has correct API key prefix", () => {
    expect(API_KEY_PREFIX).toBe("bm_live_");
  });
});

describe("RATE_LIMITS", () => {
  it("has limits for all plans", () => {
    expect(RATE_LIMITS.FREE).toBeDefined();
    expect(RATE_LIMITS.PRO).toBeDefined();
    expect(RATE_LIMITS.ENTERPRISE).toBeDefined();
  });

  it("free plan has lower limits than pro", () => {
    expect(RATE_LIMITS.FREE.requestsPerDay).toBeLessThan(
      RATE_LIMITS.PRO.requestsPerDay
    );
    expect(RATE_LIMITS.FREE.requestsPerMinute).toBeLessThan(
      RATE_LIMITS.PRO.requestsPerMinute
    );
  });

  it("pro plan has lower limits than enterprise", () => {
    expect(RATE_LIMITS.PRO.requestsPerDay).toBeLessThan(
      RATE_LIMITS.ENTERPRISE.requestsPerDay
    );
  });
});

describe("WEBHOOK_EVENTS", () => {
  it("contains required events", () => {
    expect(WEBHOOK_EVENTS).toContain("email.blocked");
    expect(WEBHOOK_EVENTS).toContain("email.allowed");
  });

  it("has at least 2 events", () => {
    expect(WEBHOOK_EVENTS.length).toBeGreaterThanOrEqual(2);
  });
});

describe("PLAN_LIMITS", () => {
  it("has limits for all plans", () => {
    expect(PLAN_LIMITS.FREE).toBeDefined();
    expect(PLAN_LIMITS.PRO).toBeDefined();
    expect(PLAN_LIMITS.ENTERPRISE).toBeDefined();
  });

  it("free plan has max 2 API keys", () => {
    expect(PLAN_LIMITS.FREE.maxApiKeys).toBe(2);
  });

  it("pro plan has more limits than free", () => {
    expect(PLAN_LIMITS.PRO.maxApiKeys).toBeGreaterThan(
      PLAN_LIMITS.FREE.maxApiKeys
    );
    expect(PLAN_LIMITS.PRO.maxWebhooks).toBeGreaterThan(
      PLAN_LIMITS.FREE.maxWebhooks
    );
  });
});

describe("VERIFICATION_REASONS", () => {
  it("has all required reasons", () => {
    expect(VERIFICATION_REASONS.allowed).toBe("allowed");
    expect(VERIFICATION_REASONS.domain_blocklist_hit).toBe(
      "domain_blocklist_hit"
    );
  });
});

describe("RISK_SCORES", () => {
  it("has score 0 for clean", () => {
    expect(RISK_SCORES[0]).toBeDefined();
  });

  it("has score 95 for disposable", () => {
    expect(RISK_SCORES[95]).toBeDefined();
  });
});
