import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getApiKeys } from "@/lib/services/apikey";
import { getUsageStats, getRecentUsage } from "@/lib/services/usage";
import { getWebhooks } from "@/lib/services/webhook";
import { PLAN_LIMITS } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const auth = await requireAuth();
  if (!auth) redirect("/sign-in");

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [apiKeys, usage, recentUsage, webhooks, todayCount] = await Promise.all([
    getApiKeys(auth.dbUser.id),
    getUsageStats(auth.dbUser.id, "30d"),
    getRecentUsage(auth.dbUser.id, 5),
    getWebhooks(auth.dbUser.id),
    prisma.usageLog.count({ where: { userId: auth.dbUser.id, createdAt: { gte: today } } }),
  ]);

  const planLimits = PLAN_LIMITS[auth.dbUser.plan];
  const usagePercent = Math.round((todayCount / planLimits.requestsPerDay) * 100);
  const isWarning = usagePercent >= 80;
  const isLimit = usagePercent >= 100;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome back! Here&apos;s an overview of your API usage.
        </p>
      </div>

      {isWarning && (
        <div className={`rounded-lg p-4 text-sm ${isLimit ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-800"}`}>
          <p className="font-medium">
            {isLimit
              ? "Daily limit reached"
              : `Approaching daily limit (${usagePercent}%)`}
          </p>
          <p className="mt-1">
            {todayCount} / {planLimits.requestsPerDay.toLocaleString()} requests used today.
            {auth.dbUser.plan === "FREE" && !isLimit && " Upgrade to Pro for 10,000 requests/day."}
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Today" value={todayCount.toLocaleString()} sub={`${usagePercent}% of ${planLimits.requestsPerDay.toLocaleString()} limit`} />
        <StatCard title="Total Requests (30d)" value={usage.summary.total_requests.toLocaleString()} />
        <StatCard title="Blocked" value={usage.summary.blocked.toLocaleString()} sub={`${(usage.summary.block_rate * 100).toFixed(1)}% block rate`} />
        <StatCard title="API Keys" value={String(apiKeys.length)} sub={`${apiKeys.filter((k) => k.isActive).length} active`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Verifications</CardTitle>
        </CardHeader>
        <CardContent>
          {recentUsage.length === 0 ? (
            <p className="text-sm text-gray-500">No verifications yet. Start using your API to see activity here.</p>
          ) : (
            <div className="space-y-4">
              {recentUsage.map((log) => (
                <ActivityRow
                  key={log.email}
                  email={log.email}
                  status={log.isDisposable ? "blocked" : "allowed"}
                  riskScore={log.riskScore}
                  time={log.createdAt.toISOString()}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {sub && <p className="text-xs text-gray-600">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function ActivityRow({ email, status, riskScore, time }: { email: string; status: "allowed" | "blocked"; riskScore: number; time: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-4">
        <div className={`h-2 w-2 rounded-full ${status === "allowed" ? "bg-green-500" : "bg-red-500"}`} />
        <div>
          <p className="text-sm font-medium text-gray-900">{email}</p>
          <p className="text-xs text-gray-600">{new Date(time).toLocaleString()}</p>
        </div>
      </div>
      <div className="text-right">
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${status === "allowed" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {status === "allowed" ? "Allowed" : "Blocked"}
        </span>
        <p className="mt-1 text-xs text-gray-600">Risk: {riskScore}</p>
      </div>
    </div>
  );
}
