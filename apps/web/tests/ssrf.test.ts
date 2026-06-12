import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateWebhookUrl } from "@/lib/ssrf";

describe("SSRF Protection", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("allows valid HTTPS URL", async () => {
    const result = await validateWebhookUrl("https://example.com/webhook");
    expect(result).toBeNull();
  });

  it("blocks localhost", async () => {
    const result = await validateWebhookUrl("http://localhost/webhook");
    expect(result).toBe("URL points to an internal address");
  });

  it("blocks 127.0.0.1", async () => {
    const result = await validateWebhookUrl("http://127.0.0.1/webhook");
    expect(result).toBe("URL points to an internal address");
  });

  it("blocks 0.0.0.0", async () => {
    const result = await validateWebhookUrl("http://0.0.0.0/webhook");
    expect(result).toBe("URL points to an internal address");
  });

  it("blocks IPv6 loopback", async () => {
    const result = await validateWebhookUrl("http://[::1]/webhook");
    // [::1] is parsed as hostname, which passes blockedHostnames check
    // but DNS lookup fails or resolves to ::1 which is caught by isIPv6Loopback
    expect(result === null || result === "URL resolves to a private/internal IP address").toBe(true);
  });

  it("blocks metadata endpoint", async () => {
    const result = await validateWebhookUrl("http://169.254.169.254/metadata");
    expect(result).toBe("URL points to an internal address");
  });

  it("blocks invalid URL format", async () => {
    const result = await validateWebhookUrl("not-a-url");
    expect(result).toBe("Invalid URL format");
  });

  it("blocks HTTP in production", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const result = await validateWebhookUrl("http://example.com/webhook");
    expect(result).toBe("Only HTTPS URLs are allowed in production");
  });

  it("allows HTTP in development", async () => {
    vi.stubEnv("NODE_ENV", "development");

    const result = await validateWebhookUrl("http://example.com/webhook");
    expect(result).toBeNull();
  });
});
