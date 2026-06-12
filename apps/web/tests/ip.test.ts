import { describe, it, expect } from "vitest";
import { getClientIp, normalizeIp } from "@/lib/ip";

function createMockRequest(headers: Record<string, string>) {
  return {
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
  } as Parameters<typeof getClientIp>[0];
}

describe("IP Utilities", () => {
  describe("getClientIp", () => {
    it("extracts IP from x-forwarded-for header", () => {
      const req = createMockRequest({
        "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178",
      });
      expect(getClientIp(req)).toBe("203.0.113.195");
    });

    it("extracts IP from x-real-ip header", () => {
      const req = createMockRequest({
        "x-real-ip": "192.168.1.100",
      });
      expect(getClientIp(req)).toBe("192.168.1.100");
    });

    it("prefers x-forwarded-for over x-real-ip", () => {
      const req = createMockRequest({
        "x-forwarded-for": "10.0.0.1",
        "x-real-ip": "192.168.1.1",
      });
      expect(getClientIp(req)).toBe("10.0.0.1");
    });

    it("returns 'unknown' when no IP headers present", () => {
      const req = createMockRequest({});
      expect(getClientIp(req)).toBe("unknown");
    });

    it("strips IPv6 mapped prefix from x-forwarded-for", () => {
      const req = createMockRequest({
        "x-forwarded-for": "::ffff:192.168.1.1",
      });
      expect(getClientIp(req)).toBe("192.168.1.1");
    });

    it("strips IPv6 mapped prefix from x-real-ip", () => {
      const req = createMockRequest({
        "x-real-ip": "::ffff:10.0.0.1",
      });
      expect(getClientIp(req)).toBe("10.0.0.1");
    });

    it("handles IPv6 addresses without prefix", () => {
      const req = createMockRequest({
        "x-forwarded-for": "2001:db8::1",
      });
      expect(getClientIp(req)).toBe("2001:db8::1");
    });

    it("trims whitespace from IP", () => {
      const req = createMockRequest({
        "x-forwarded-for": "  203.0.113.195  ",
      });
      expect(getClientIp(req)).toBe("203.0.113.195");
    });
  });

  describe("normalizeIp", () => {
    it("normalizes a valid IP", () => {
      expect(normalizeIp("192.168.1.1")).toBe("192.168.1.1");
    });

    it("lowercases IPv6", () => {
      expect(normalizeIp("2001:DB8::1")).toBe("2001:db8::1");
    });

    it("strips IPv6 mapped prefix", () => {
      expect(normalizeIp("::ffff:10.0.0.1")).toBe("10.0.0.1");
    });

    it("trims whitespace", () => {
      expect(normalizeIp("  192.168.1.1  ")).toBe("192.168.1.1");
    });

    it("returns 'unknown' for null", () => {
      expect(normalizeIp(null)).toBe("unknown");
    });

    it("returns 'unknown' for undefined", () => {
      expect(normalizeIp(undefined)).toBe("unknown");
    });

    it("returns 'unknown' for empty string", () => {
      expect(normalizeIp("")).toBe("unknown");
    });

    it("returns 'unknown' for whitespace-only string", () => {
      expect(normalizeIp("   ")).toBe("unknown");
    });
  });
});
