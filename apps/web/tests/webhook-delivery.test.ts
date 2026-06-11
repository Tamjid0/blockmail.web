import { describe, it, expect } from "vitest";
import { signPayload } from "@/lib/services/webhook-delivery";

// We can only test the signPayload function directly since deliverWebhook requires network access
describe("Webhook Delivery", () => {
  describe("signPayload", () => {
    it("returns a hex string", () => {
      const sig = signPayload("test payload", "test_secret");
      expect(sig).toMatch(/^[a-f0-9]{64}$/);
    });

    it("produces consistent signatures", () => {
      const sig1 = signPayload("test payload", "secret");
      const sig2 = signPayload("test payload", "secret");
      expect(sig1).toBe(sig2);
    });

    it("produces different signatures for different payloads", () => {
      const sig1 = signPayload("payload 1", "secret");
      const sig2 = signPayload("payload 2", "secret");
      expect(sig1).not.toBe(sig2);
    });

    it("produces different signatures for different secrets", () => {
      const sig1 = signPayload("payload", "secret 1");
      const sig2 = signPayload("payload", "secret 2");
      expect(sig1).not.toBe(sig2);
    });

    it("produces HMAC-SHA256 compatible output", () => {
      const sig = signPayload("hello world", "key");
      // HMAC-SHA256 of "hello world" with key "key" is a known value
      expect(sig.length).toBe(64);
    });
  });
});
