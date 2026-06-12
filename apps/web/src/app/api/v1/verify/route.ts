import { NextRequest, NextResponse } from "next/server";
import { verifyEmailSchema } from "@/lib/validator";
import { getApiKeyByPrefix, updateLastUsedAt } from "@/lib/services/apikey";
import { logUsage } from "@/lib/services/usage";
import { triggerWebhooks } from "@/lib/services/webhook-delivery";
import { logAudit, AuditActions } from "@/lib/audit";
import { API_KEY_HEADER, RATE_LIMIT_CONFIG, type PlanType } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { checkComprehensiveRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/ip";
import crypto from "crypto";

const ENGINE_URL = process.env.BLOCKMAIL_ENGINE_URL || "http://localhost:8080";
const ENGINE_API_KEY = process.env.BLOCKMAIL_ENGINE_API_KEY || "development-secret-key";
const BLOCKMAIL_SECRET = process.env.BLOCKMAIL_SECRET || "";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const ip = getClientIp(request);

  // Check if request came through Zuplo gateway (shared secret validation)
  const zuploSecret = request.headers.get("x-blockmail-secret");
  const isZuploVerified = BLOCKMAIL_SECRET !== "" && zuploSecret === BLOCKMAIL_SECRET;

  try {
    // 1. Authenticate (Zuplo or self-managed)
    let userId: string;
    let userPlan: PlanType;
    let keyId: string;

    if (isZuploVerified) {
      // Zuplo already authenticated + secret validated
      // Try to resolve real user from forwarded userId header
      const zuploUserId = request.headers.get("x-blockmail-user-id");
      if (zuploUserId) {
        const dbUser = await prisma.user.findUnique({ where: { id: zuploUserId } });
        if (dbUser) {
          userId = dbUser.id;
          userPlan = dbUser.plan as PlanType;
          // Find the API key for this user
          const userKey = await prisma.apiKey.findFirst({ where: { userId: dbUser.id } });
          keyId = userKey?.id ?? "zuplo-key";
        } else {
          userId = zuploUserId;
          userPlan = "FREE";
          keyId = "zuplo-key";
        }
      } else {
        userId = "zuplo-user";
        userPlan = "FREE";
        keyId = "zuplo-key";
      }
    } else {
      // Self-managed key authentication
      const apiKey = request.headers.get(API_KEY_HEADER);
      if (!apiKey) {
        return NextResponse.json(
          { success: false, error: { code: "MISSING_API_KEY", message: "API key is required." } },
          { status: 401 }
        );
      }
      const keyPrefix = apiKey.substring(0, 11);
      const lookupKey = await getApiKeyByPrefix(keyPrefix);
      if (!lookupKey) {
        logAudit({ action: AuditActions.API_KEY_INVALID, ip, details: { keyPrefix }, severity: "warn" });
        return NextResponse.json(
          { success: false, error: { code: "INVALID_API_KEY", message: "Invalid API key." } },
          { status: 401 }
        );
      }
      const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
      if (keyHash !== lookupKey.unkeyId && apiKey !== lookupKey.unkeyId) {
        logAudit({ action: AuditActions.API_KEY_INVALID, userId: lookupKey.userId, apiKeyId: lookupKey.id, ip, details: { reason: "hash_mismatch" }, severity: "warn" });
        return NextResponse.json(
          { success: false, error: { code: "INVALID_API_KEY", message: "Invalid API key." } },
          { status: 401 }
        );
      }
      if (!lookupKey.isActive) {
        logAudit({ action: AuditActions.API_KEY_REVOKED, userId: lookupKey.userId, apiKeyId: lookupKey.id, ip, severity: "warn" });
        return NextResponse.json(
          { success: false, error: { code: "KEY_REVOKED", message: "This API key has been revoked." } },
          { status: 401 }
        );
      }
      userId = lookupKey.user.id;
      userPlan = lookupKey.user.plan as PlanType;
      keyId = lookupKey.id;
    }

    // 2. Rate limits (skip if Zuplo handles them)
    if (!isZuploVerified) {
      const planLimits = RATE_LIMIT_CONFIG.api[userPlan] ?? RATE_LIMIT_CONFIG.api.FREE;

      const rateCheck = await checkComprehensiveRateLimit({
        minuteKey: `api:minute:${keyId}`,
        minuteLimit: planLimits.perMinute,
        dailyKey: `api:daily:${userId}`,
        dailyLimit: planLimits.perDay,
      });

      if (!rateCheck.allowed) {
        if (!rateCheck.minute.allowed) {
          logAudit({ action: AuditActions.RATE_LIMIT_HIT, userId, apiKeyId: keyId, ip, details: { type: "minute" }, severity: "warn" });
          return NextResponse.json(
            { success: false, error: { code: "RATE_LIMIT_EXCEEDED", message: "Rate limit exceeded." } },
            { status: 429, headers: { "Retry-After": String(Math.ceil((rateCheck.minute.resetAt - Date.now()) / 1000)) } }
          );
        }
        if (!rateCheck.daily.allowed) {
          logAudit({ action: AuditActions.DAILY_LIMIT_HIT, userId, apiKeyId: keyId, ip, details: { type: "daily" }, severity: "warn" });
          return NextResponse.json(
            { success: false, error: { code: "DAILY_LIMIT_EXCEEDED", message: "Daily limit exceeded." } },
            { status: 429 }
          );
        }
      }
    }

    // 3. Parse and validate request body
    const body = await request.json();
    const result = verifyEmailSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: result.error.issues[0].message } },
        { status: 400 }
      );
    }

    const { email, context } = result.data;

    // 4. Forward to Go engine
    let engineData;
    try {
      const engineResponse = await fetch(`${ENGINE_URL}/v1/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": ENGINE_API_KEY },
        body: JSON.stringify({ email, context }),
        signal: AbortSignal.timeout(10000),
      });
      if (!engineResponse.ok) throw new Error(`Engine returned ${engineResponse.status}`);
      engineData = await engineResponse.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: "ENGINE_UNAVAILABLE", message: "Verification engine is not available." } },
        { status: 503 }
      );
    }

    const latencyMs = Date.now() - startTime;

    // 5. Log usage (skip only for unresolved Zuplo users)
    const canTrack = !isZuploVerified || userId !== "zuplo-user";
    if (canTrack) {
      const domain = email.split("@")[1] || "";
      logUsage({
        userId, apiKeyId: keyId, email, domain,
        isDisposable: engineData.is_disposable ?? false,
        riskScore: engineData.risk_score ?? 0,
        tierTriggered: engineData.analysis?.tier_triggered ?? 0,
        reason: engineData.analysis?.reason ?? "allowed",
        latencyMs,
        ipAddress: context?.ip_address,
        userAgent: context?.user_agent,
        countryCode: context?.country_code,
      }).catch(() => {});
    }

    // 6. Update last used (fire and forget)
    if (canTrack && keyId !== "zuplo-key") {
      updateLastUsedAt(keyId).catch(() => {});
    }

    // 7. Audit log (fire and forget)
    if (canTrack) {
      logAudit({
        action: AuditActions.API_KEY_USED,
        userId, apiKeyId: keyId, ip,
        details: { email, is_disposable: engineData.is_disposable },
        severity: "info",
      });
    }

    // 8. Trigger webhooks (fire and forget, skip for unresolved Zuplo)
    if (canTrack) {
      const webhookEvent = engineData.is_disposable ? "email.blocked" : "email.allowed";
      triggerWebhooks(userId, webhookEvent, {
        email,
        is_disposable: engineData.is_disposable ?? false,
        risk_score: engineData.risk_score ?? 0,
        reason: engineData.analysis?.reason ?? "allowed",
        request_id: engineData.request_id ?? `req_${Date.now()}`,
      }).catch(() => {});
    }

    // 9. Return response
    return NextResponse.json({
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
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
