import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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

export interface RequestLogEntry {
  id: string;
  email: string;
  domain: string;
  isDisposable: boolean;
  riskScore: number;
  reason: string;
  apiKeyId: string;
  latencyMs: number;
  createdAt: string;
}

export interface DomainStat {
  domain: string;
  total: number;
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

export async function getUsageStats(userId: string, period: string, keyFilter?: string) {
  const days = getPeriodDays(period);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const whereBase = { userId, createdAt: { gte: since } };
  const where = keyFilter ? { ...whereBase, apiKeyId: keyFilter } : whereBase;

  const [summary, rawDaily, byReason, byKey, avgRisk, byDomainRaw] = await Promise.all([
    prisma.usageLog.aggregate({
      where,
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
        ${keyFilter ? Prisma.sql`AND "apiKeyId" = ${keyFilter}` : Prisma.empty}
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
      ORDER BY date ASC
    `,

    prisma.usageLog.groupBy({
      by: ["reason"],
      where,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),

    prisma.usageLog.groupBy({
      by: ["apiKeyId"],
      where: keyFilter ? { userId, apiKeyId: keyFilter, createdAt: { gte: since } } : { userId, createdAt: { gte: since } },
      _count: { id: true },
    }),

    prisma.usageLog.aggregate({
      where,
      _avg: { riskScore: true },
    }),

    prisma.$queryRaw`
      SELECT
        "domain",
        COUNT(*)::int as total,
        SUM(CASE WHEN "isDisposable" = true THEN 1 ELSE 0 END)::int as blocked,
        SUM(CASE WHEN "isDisposable" = false THEN 1 ELSE 0 END)::int as allowed
      FROM "UsageLog"
      WHERE "userId" = ${userId}
        AND "createdAt" >= ${since}
        ${keyFilter ? Prisma.sql`AND "apiKeyId" = ${keyFilter}` : Prisma.empty}
      GROUP BY "domain"
      ORDER BY total DESC
      LIMIT 10
    `,
  ]);

  const daily = rawDaily as DailyRow[];
  const totalRequests = summary._count.id;
  const blocked = daily.reduce((sum: number, d: DailyRow) => sum + d.blocked, 0);

  const byKeyWithBlocked = await Promise.all(
    byKey.map(async (k) => {
      const blockedCount = await prisma.usageLog.count({
        where: { userId, apiKeyId: k.apiKeyId, isDisposable: true, createdAt: { gte: since }, ...(keyFilter ? { apiKeyId: keyFilter } : {}) },
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
      avg_risk_score: Math.round((avgRisk._avg.riskScore ?? 0) * 10) / 10,
    },
    daily,
    by_reason: byReason.map((r) => ({
      reason: r.reason,
      count: r._count.id,
    })),
    by_key: byKeyWithBlocked,
    by_domain: (byDomainRaw as DomainStat[]),
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

export async function getRequestLog(
  userId: string,
  opts: { page: number; limit: number; keyFilter?: string; statusFilter?: "blocked" | "allowed" }
): Promise<{ entries: RequestLogEntry[]; total: number; page: number; totalPages: number }> {
  const { page, limit, keyFilter, statusFilter } = opts;
  const where: Prisma.UsageLogWhereInput = { userId };
  if (keyFilter) where.apiKeyId = keyFilter;
  if (statusFilter === "blocked") where.isDisposable = true;
  if (statusFilter === "allowed") where.isDisposable = false;

  const [entries, total] = await Promise.all([
    prisma.usageLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        email: true,
        domain: true,
        isDisposable: true,
        riskScore: true,
        reason: true,
        apiKeyId: true,
        latencyMs: true,
        createdAt: true,
      },
    }),
    prisma.usageLog.count({ where }),
  ]);

  return {
    entries: entries.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
