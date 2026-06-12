import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logUsage } from "@/lib/services/usage";
import { getApiKeyByPrefix, updateLastUsedAt } from "@/lib/services/apikey";
import { getClientIp } from "@/lib/ip";
import { checkComprehensiveRateLimit } from "@/lib/rate-limit";
import { RATE_LIMIT_CONFIG } from "@/lib/constants";
import { createServerClient } from "@supabase/ssr";

const ENGINE_URL = process.env.BLOCKMAIL_ENGINE_URL || "http://localhost:8080";
const ENGINE_API_KEY = process.env.BLOCKMAIL_ENGINE_API_KEY || "development-secret-key";
const DEMO_KEY_PREFIX = "bm_live_demo";
const BLOCKMAIL_SECRET = process.env.BLOCKMAIL_SECRET || "";

const trySchema = z.object({
  email: z.string().email("Invalid email format"),
});

const TIER_NAMES = [
  "Format Analysis",
  "Domain Intelligence",
  "Network Fingerprint",
  "Reputation Scoring",
  "Infrastructure Analysis",
  "Pattern Detection",
];

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify request came through gateway (skip if no secret configured — dev mode)
    // Also skip if request is from same origin (browser direct call, not through Zuplo)
    const zuploSecret = request.headers.get("x-blockmail-secret");
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    const isSameOrigin = origin && host && new URL(origin).host === host;

    if (BLOCKMAIL_SECRET !== "" && zuploSecret !== BLOCKMAIL_SECRET && !isSameOrigin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Extract client IP
    const ip = getClientIp(request);

    // Check if user is authenticated (for higher try-it limits)
    let userId: string | null = null;
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll() {
              // No-op for read-only check
            },
          },
        }
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    } catch {
      // Not authenticated — use anonymous limits
    }

    // Apply rate limits based on auth status
    const isAuthenticated = userId !== null;
    const limits = isAuthenticated
      ? RATE_LIMIT_CONFIG.tryItAuthenticated
      : RATE_LIMIT_CONFIG.tryItAnonymous;
    const rateLimitKey = isAuthenticated ? `try:user:${userId}` : `try:ip:${ip}`;

    const rateCheck = await checkComprehensiveRateLimit({
      minuteKey: rateLimitKey,
      minuteLimit: limits.perMinute,
      dailyKey: rateLimitKey,
      dailyLimit: limits.perDay,
    });

    if (!rateCheck.allowed) {
      const retryAfter = rateCheck.minute.allowed
        ? 60 // Daily limit hit — retry tomorrow
        : Math.ceil((rateCheck.minute.resetAt - Date.now()) / 1000);

      return NextResponse.json(
        {
          error: isAuthenticated
            ? "Rate limit exceeded. Please try again later."
            : "Free demo limit exceeded. Sign in for higher limits.",
          limit_type: rateCheck.minute.allowed ? "daily" : "minute",
          retry_after: retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(limits.perMinute),
            "X-RateLimit-Remaining": String(rateCheck.minute.remaining),
          },
        }
      );
    }

    const body = await request.json();
    const parsed = trySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Forward to Go engine
    let engineData;
    try {
      const engineResponse = await fetch(`${ENGINE_URL}/v1/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": ENGINE_API_KEY,
        },
        body: JSON.stringify({ email }),
        signal: AbortSignal.timeout(10000),
      });

      if (!engineResponse.ok) {
        throw new Error(`Engine returned ${engineResponse.status}`);
      }

      engineData = await engineResponse.json();
    } catch {
      return NextResponse.json(
        { error: "Verification engine is not available. Please try again later." },
        { status: 503 }
      );
    }

    const latencyMs = Date.now() - startTime;

    // Log usage with demo key (fire and forget)
    const demoKey = await getApiKeyByPrefix(DEMO_KEY_PREFIX);
    if (demoKey) {
      const domain = email.split("@")[1] || "";
      logUsage({
        userId: demoKey.userId,
        apiKeyId: demoKey.id,
        email,
        domain,
        isDisposable: engineData.is_disposable ?? false,
        riskScore: engineData.risk_score ?? 0,
        tierTriggered: engineData.analysis?.tier_triggered ?? 0,
        reason: engineData.analysis?.reason ?? "allowed",
        latencyMs,
      }).catch(() => {});
      updateLastUsedAt(demoKey.id).catch(() => {});
    }

    // Build tier results
    const tierResults = TIER_NAMES.map((name, i) => ({
      tier: i + 1,
      name,
      passed: engineData.analysis?.tier_triggered
        ? i + 1 !== engineData.analysis.tier_triggered
        : true,
      details:
        engineData.analysis?.tier_triggered === i + 1
          ? `Blocked at this tier: ${engineData.analysis?.reason || "failed"}`
          : engineData.analysis?.tier_triggered !== undefined && i + 1 <= engineData.analysis.tier_triggered
            ? `Checked: ${name}`
            : "Not reached",
    }));

    const isDisposable = engineData.is_disposable ?? false;
    const riskScore = engineData.risk_score ?? 0;

    let recommendation: string;
    if (isDisposable) {
      recommendation = "This is a disposable email address. We recommend blocking it to maintain a clean user database.";
    } else if (riskScore >= 50) {
      recommendation = "This email has moderate risk. Consider additional verification steps.";
    } else {
      recommendation = "This appears to be a legitimate email address. Safe to accept.";
    }

    return NextResponse.json({
      email,
      is_disposable: isDisposable,
      is_valid: true,
      risk_score: riskScore,
      tier_results: tierResults,
      recommendation,
      rate_limit: {
        limit: limits.perMinute,
        remaining: rateCheck.minute.remaining,
        reset_at: rateCheck.minute.resetAt,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
