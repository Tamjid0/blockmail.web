import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logUsage } from "@/lib/services/usage";
import { getApiKeyByPrefix, updateLastUsedAt } from "@/lib/services/apikey";

const ENGINE_URL = process.env.BLOCKMAIL_ENGINE_URL || "http://localhost:8080";
const ENGINE_API_KEY = process.env.BLOCKMAIL_ENGINE_API_KEY || "development-secret-key";
const DEMO_KEY_PREFIX = "bm_live_demo";

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

// Simple in-memory rate limit for demo (5 requests/minute per IP)
const demoRateLimit = new Map<string, { count: number; resetAt: number }>();

function checkDemoRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const entry = demoRateLimit.get(ip);

  if (!entry || now > entry.resetAt) {
    demoRateLimit.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limit by IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    if (!checkDemoRateLimit(ip)) {
      return NextResponse.json(
        { error: "Demo rate limit exceeded. Please wait a minute." },
        { status: 429 }
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
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
