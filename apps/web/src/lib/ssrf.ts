import { isIP } from "net";

const BLOCKED_RANGES = [
  // Loopback
  "127.0.0.0/8",
  "::1/128",
  // Private networks
  "10.0.0.0/8",
  "172.16.0.0/12",
  "192.168.0.0/16",
  // Link-local
  "169.254.0.0/16",
  // Cloud metadata endpoints
  "169.254.169.254/32",
];

function ipToNumber(ip: string): number {
  const parts = ip.split(".").map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function cidrMatch(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split("/");
  const mask = ~((1 << (32 - parseInt(bits))) - 1) >>> 0;
  return (ipToNumber(ip) & mask) === (ipToNumber(range) & mask);
}

function isPrivateIP(ip: string): boolean {
  return BLOCKED_RANGES.some((range) => cidrMatch(ip, range));
}

function isIPv6Loopback(ip: string): boolean {
  return ip === "::1" || ip === "0:0:0:0:0:0:0:1";
}

/**
 * Validates a URL is safe to fetch (not pointing to internal/private networks).
 * Returns null if safe, or an error message if blocked.
 */
export async function validateWebhookUrl(url: string): Promise<string | null> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "Invalid URL format";
  }

  // Only allow HTTPS in production
  if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
    return "Only HTTPS URLs are allowed in production";
  }

  // Block common internal hostnames
  const hostname = parsed.hostname.toLowerCase();
  const blockedHostnames = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
    "metadata.google.internal",
    "instance-data",
    "169.254.169.254",
  ];

  if (blockedHostnames.includes(hostname)) {
    return "URL points to an internal address";
  }

  // Resolve DNS and check IP
  try {
    const { lookup } = await import("dns/promises");
    const { address } = await lookup(hostname, { family: 4 });

    if (isIPv6Loopback(address) || isPrivateIP(address)) {
      return "URL resolves to a private/internal IP address";
    }
  } catch {
    // DNS lookup failed — could be intentional, allow it
  }

  return null;
}
