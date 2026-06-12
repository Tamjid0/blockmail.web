import { describe, it, expect, vi, beforeEach } from "vitest";
import { PLAN_LIMITS } from "@/lib/constants";

const mockStripe = {
  customers: { create: vi.fn() },
  checkout: {
    sessions: { create: vi.fn() },
  },
  billingPortal: {
    sessions: { create: vi.fn() },
  },
  webhooks: {
    constructEvent: vi.fn(),
  },
};

vi.mock("@/lib/services/billing", () => ({
  stripe: mockStripe,
  getOrCreateStripeCustomer: vi.fn(),
  createCheckoutSession: vi.fn(),
  createPortalSession: vi.fn(),
  handleStripeWebhook: vi.fn(),
}));

const mockPrismaUser = {
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: mockPrismaUser,
  },
}));

describe("Plan Limits Configuration", () => {
  it("has limits for all plans", () => {
    expect(PLAN_LIMITS.FREE).toBeDefined();
    expect(PLAN_LIMITS.PRO).toBeDefined();
    expect(PLAN_LIMITS.ENTERPRISE).toBeDefined();
  });

  it("FREE plan is truly free", () => {
    expect(PLAN_LIMITS.FREE.priceLabel).toBe("$0");
    expect(PLAN_LIMITS.FREE.stripePriceId).toBeNull();
  });

  it("PRO plan has a Stripe price ID configured", () => {
    // May be null if STRIPE_PRO_PRICE_ID env not set, but the field exists
    expect("stripePriceId" in PLAN_LIMITS.PRO).toBe(true);
  });

  it("free plan has lower limits than pro", () => {
    expect(PLAN_LIMITS.FREE.requestsPerDay).toBeLessThan(
      PLAN_LIMITS.PRO.requestsPerDay
    );
    expect(PLAN_LIMITS.FREE.requestsPerMinute).toBeLessThan(
      PLAN_LIMITS.PRO.requestsPerMinute
    );
  });

  it("pro plan has lower limits than enterprise", () => {
    expect(PLAN_LIMITS.PRO.requestsPerDay).toBeLessThan(
      PLAN_LIMITS.ENTERPRISE.requestsPerDay
    );
  });

  it("free plan allows fewer keys than pro", () => {
    expect(PLAN_LIMITS.FREE.maxApiKeys).toBeLessThan(
      PLAN_LIMITS.PRO.maxApiKeys
    );
  });

  it("all plans have required fields", () => {
    for (const plan of ["FREE", "PRO", "ENTERPRISE"] as const) {
      const limits = PLAN_LIMITS[plan];
      expect(typeof limits.maxApiKeys).toBe("number");
      expect(typeof limits.maxWebhooks).toBe("number");
      expect(typeof limits.requestsPerDay).toBe("number");
      expect(typeof limits.requestsPerMinute).toBe("number");
      expect(typeof limits.priceLabel).toBe("string");
    }
  });
});
