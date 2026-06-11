import { NextRequest, NextResponse } from "next/server";
import { verifyEmailSchema } from "@/lib/validator";
import { getApiKeyByPrefix, updateLastUsedAt } from "@/lib/services/apikey";
import { logUsage } from "@/lib/services/usage";
import { triggerWebhooks } from "@/lib/services/webhook-delivery";
import { logAudit, AuditActions } from "@/lib/audit";
import { RATE_LIMITS, API_KEY_HEADER } from "@/lib/constants";
import crypto from "crypto";

const ENGINE_URL = process.env.BLOCKMAIL_ENGINE_URL || "http://localhost:8080";
const ENGINE_API_KEY = process.env.BLOCKMAIL_ENGINE_API_KEY || "development-secret-key";

// In-memory rate limit store (per-minute)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkMinuteRateLimit(key: string, limit: number): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

function getDailyRateLimitKey(userId: string): string {
  const today = new Date().toISOString().split("T")[0];
  return `daily:${userId}:${today}`;
}

// Simple daily counter using the same store
const dailyLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkDailyRateLimit(userId: string, limit: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const today = new Date().toISOString().split("T")[0];
  const key = `daily:${userId}:${today}`;
  const endOfDay = new Date();
  endOfDay.setUTCHours(23, 59, 59, 999);
  const windowMs = endOfDay.getTime() - now;

  const entry = dailyLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    dailyLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";

  try {
    // 1. Extract API key
    const apiKey = request.headers.get(API_KEY_HEADER);
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: { code: "MISSING_API_KEY", message: "API key is required. Pass it via the X-API-Key header." } },
        { status: 401 }
      );
    }

    // 2. Validate key format
    if (!apiKey.startsWith("bm_live_")) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_API_KEY", message: "Invalid API key format." } },
        { status: 401 }
      );
    }

    // 3. Look up key by prefix and verify hash
    const keyPrefix = apiKey.substring(0, 11);
    const storedKey = await getApiKeyByPrefix(keyPrefix);

    if (!storedKey) {
      logAudit({ action: AuditActions.API_KEY_INVALID, ip, details: { keyPrefix }, severity: "warn" });
      return NextResponse.json(
        { success: false, error: { code: "INVALID_API_KEY", message: "Invalid API key." } },
        { status: 401 }
      );
    }

    // Verify the full key matches
    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
    if (keyHash !== storedKey.unkeyId) {
      logAudit({ action: AuditActions.API_KEY_INVALID, userId: storedKey.userId, apiKeyId: storedKey.id, ip, details: { reason: "hash_mismatch" }, severity: "warn" });
      return NextResponse.json(
        { success: false, error: { code: "INVALID_API_KEY", message: "Invalid API key." } },
        { status: 401 }
      );
    }

    // 4. Check key is active
    if (!storedKey.isActive) {
      logAudit({ action: AuditActions.API_KEY_REVOKED, userId: storedKey.userId, apiKeyId: storedKey.id, ip, severity: "warn" });
      return NextResponse.json(
        { success: false, error: { code: "KEY_REVOKED", message: "This API key has been revoked." } },
        { status: 401 }
      );
    }

    const user = storedKey.user;

    // 5. Check rate limits
    const planLimits = RATE_LIMITS[user.plan];

    // Per-minute rate limit
    const minuteCheck = checkMinuteRateLimit(storedKey.id, storedKey.rateLimit);
    if (!minuteCheck.allowed) {
      logAudit({ action: AuditActions.RATE_LIMIT_HIT, userId: user.id, apiKeyId: storedKey.id, ip, details: { type: "minute" }, severity: "warn" });
      return NextResponse.json(
        { success: false, error: { code: "RATE_LIMIT_EXCEEDED", message: "Rate limit exceeded. Try again later." } },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(storedKey.rateLimit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(minuteCheck.resetAt / 1000)),
            "Retry-After": String(Math.ceil((minuteCheck.resetAt - Date.now()) / 1000)),
          },
        }
      );
    }

    // Daily rate limit
    const dailyCheck = checkDailyRateLimit(user.id, storedKey.dailyLimit);
    if (!dailyCheck.allowed) {
      logAudit({ action: AuditActions.DAILY_LIMIT_HIT, userId: user.id, apiKeyId: storedKey.id, ip, details: { type: "daily" }, severity: "warn" });
      return NextResponse.json(
        { success: false, error: { code: "DAILY_LIMIT_EXCEEDED", message: "Daily request limit exceeded." } },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(storedKey.dailyLimit),
            "X-RateLimit-Remaining": "0",
            "X-DailyLimit-Limit": String(storedKey.dailyLimit),
            "X-DailyLimit-Remaining": "0",
          },
        }
      );
    }

    // 6. Parse and validate request body
    const body = await request.json();
    const result = verifyEmailSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: result.error.issues[0].message } },
        { status: 400 }
      );
    }

    const { email, context } = result.data;

    // 7. Forward to Go engine
    let engineData;
    try {
      const engineResponse = await fetch(`${ENGINE_URL}/v1/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": ENGINE_API_KEY,
        },
        body: JSON.stringify({ email, context }),
        signal: AbortSignal.timeout(10000),
      });

      if (!engineResponse.ok) {
        throw new Error(`Engine returned ${engineResponse.status}`);
      }

      engineData = await engineResponse.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: "ENGINE_UNAVAILABLE", message: "Verification engine is not available." } },
        { status: 503 }
      );
    }

    const latencyMs = Date.now() - startTime;

    // 8. Log usage to database
    const domain = email.split("@")[1] || "";
    await logUsage({
      userId: user.id,
      apiKeyId: storedKey.id,
      email,
      domain,
      isDisposable: engineData.is_disposable ?? false,
      riskScore: engineData.risk_score ?? 0,
      tierTriggered: engineData.analysis?.tier_triggered ?? 0,
      reason: engineData.analysis?.reason ?? "allowed",
      latencyMs,
      ipAddress: context?.ip_address,
      userAgent: context?.user_agent,
      countryCode: context?.country_code,
    });

    // 9. Update last used timestamp (fire and forget)
    updateLastUsedAt(storedKey.id).catch(() => {});

    // 10. Audit log (fire and forget)
    logAudit({
      action: AuditActions.API_KEY_USED,
      userId: user.id,
      apiKeyId: storedKey.id,
      ip,
      details: { email, is_disposable: engineData.is_disposable },
      severity: "info",
    });

    // 11. Trigger webhooks (fire and forget)
    const webhookEvent = engineData.is_disposable ? "email.blocked" : "email.allowed";
    triggerWebhooks(user.id, webhookEvent, {
      email,
      is_disposable: engineData.is_disposable ?? false,
      risk_score: engineData.risk_score ?? 0,
      reason: engineData.analysis?.reason ?? "allowed",
      request_id: engineData.request_id ?? `req_${Date.now()}`,
    }).catch(() => {});

    // 12. Return response with rate limit headers
    return NextResponse.json(
      {
        success: true,
        data: {
          email,
          is_disposable: engineData.is_disposable ?? false,
          risk_score: engineData.risk_score ?? 0,
          analysis: engineData.analysis ?? {},
        },
        meta: {
          request_id: engineData.request_id ?? `req_${Date.now()}`,
          latency_ms: latencyMs,
        },
      },
      {
        headers: {
          "X-RateLimit-Limit": String(storedKey.rateLimit),
          "X-RateLimit-Remaining": String(minuteCheck.remaining),
          "X-RateLimit-Reset": String(Math.ceil(minuteCheck.resetAt / 1000)),
          "X-DailyLimit-Limit": String(storedKey.dailyLimit),
          "X-DailyLimit-Remaining": String(dailyCheck.remaining),
        },
      }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
