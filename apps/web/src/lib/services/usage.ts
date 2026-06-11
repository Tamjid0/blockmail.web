import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export interface LogUsageInput {
  userId: string;
  apiKeyId: string;
  email: string;
  domain: string;
  isDisposable: boolean;
  riskScore: number;
  tierTriggered: number;
  reason: string;
  latencyMs: number;
  ipAddress?: string;
  userAgent?: string;
  countryCode?: string;
}

export interface DailyRow {
  date: string;
  requests: number;
  blocked: number;
  allowed: number;
}

export async function logUsage(data: LogUsageInput) {
  const emailHash = crypto.createHash("sha256").update(data.email).digest("hex");
  const requestId = `req_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

  return prisma.usageLog.create({
    data: {
      userId: data.userId,
      apiKeyId: data.apiKeyId,
      requestId,
      email: data.email,
      emailHash,
      domain: data.domain,
      isDisposable: data.isDisposable,
      riskScore: data.riskScore,
      tierTriggered: data.tierTriggered,
      reason: data.reason,
      latencyMs: data.latencyMs,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      countryCode: data.countryCode,
    },
  });
}

function getPeriodDays(period: string): number {
  switch (period) {
    case "7d":
      return 7;
    case "90d":
      return 90;
    default:
      return 30;
  }
}

export async function getUsageStats(userId: string, period: string) {
  const days = getPeriodDays(period);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [summary, rawDaily, byReason, byKey] = await Promise.all([
    prisma.usageLog.aggregate({
      where: { userId, createdAt: { gte: since } },
      _count: { id: true },
      _avg: { riskScore: true },
    }),

    prisma.$queryRaw`
      SELECT
        TO_CHAR("createdAt", 'YYYY-MM-DD') as date,
        COUNT(*)::int as requests,
        SUM(CASE WHEN "isDisposable" = true THEN 1 ELSE 0 END)::int as blocked,
        SUM(CASE WHEN "isDisposable" = false THEN 1 ELSE 0 END)::int as allowed
      FROM "UsageLog"
      WHERE "userId" = ${userId}
        AND "createdAt" >= ${since}
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
      ORDER BY date ASC
    `,

    prisma.usageLog.groupBy({
      by: ["reason"],
      where: { userId, createdAt: { gte: since } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),

    prisma.usageLog.groupBy({
      by: ["apiKeyId"],
      where: { userId, createdAt: { gte: since } },
      _count: { id: true },
    }),
  ]);

  const daily = rawDaily as DailyRow[];
  const totalRequests = summary._count.id;
  const blocked = daily.reduce((sum: number, d: DailyRow) => sum + d.blocked, 0);

  const byKeyWithBlocked = await Promise.all(
    byKey.map(async (k) => {
      const blockedCount = await prisma.usageLog.count({
        where: { userId, apiKeyId: k.apiKeyId, isDisposable: true, createdAt: { gte: since } },
      });
      return { key_id: k.apiKeyId, requests: k._count.id, blocked: blockedCount };
    })
  );

  return {
    summary: {
      total_requests: totalRequests,
      blocked,
      allowed: totalRequests - blocked,
      block_rate: totalRequests > 0 ? blocked / totalRequests : 0,
    },
    daily,
    by_reason: byReason.map((r) => ({
      reason: r.reason,
      count: r._count.id,
    })),
    by_key: byKeyWithBlocked,
  };
}

export async function getRecentUsage(userId: string, limit: number = 10) {
  return prisma.usageLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      email: true,
      isDisposable: true,
      riskScore: true,
      createdAt: true,
    },
  });
}
