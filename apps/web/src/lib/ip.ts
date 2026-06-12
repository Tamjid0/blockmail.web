import type { NextRequest } from "next/server";

/**
 * Extract the real client IP from request headers.
 * Trusted proxies (Vercel, Railway, etc.) set x-forwarded-for.
 * Falls back to x-real-ip, then direct connection.
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp) return stripIPv6Prefix(firstIp);
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return stripIPv6Prefix(realIp.trim());

  return "unknown";
}

/**
 * Strip IPv6 mapped prefix (::ffff:) from addresses.
 * Example: ::ffff:192.168.1.1 → 192.168.1.1
 */
function stripIPv6Prefix(ip: string): string {
  if (ip.startsWith("::ffff:")) {
    return ip.slice(7);
  }
  return ip;
}

/**
 * Normalize an IP address for consistent rate limit key usage.
 * - Trims whitespace
 * - Lowercases (for IPv6)
 * - Strips IPv6 mapped prefix
 * - Returns "unknown" for empty/invalid
 */
export function normalizeIp(raw: string | null | undefined): string {
  if (!raw) return "unknown";
  const cleaned = raw.trim().toLowerCase();
  if (!cleaned) return "unknown";
  return stripIPv6Prefix(cleaned);
}
