import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getApiKeys } from "@/lib/services/apikey";
import { getUsageStats, getRecentUsage } from "@/lib/services/usage";
import { getWebhooks } from "@/lib/services/webhook";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const auth = await requireAuth();
  if (!auth) redirect("/sign-in");

  const [apiKeys, usage, recentUsage, webhooks] = await Promise.all([
    getApiKeys(auth.dbUser.id),
    getUsageStats(auth.dbUser.id, "30d"),
    getRecentUsage(auth.dbUser.id, 5),
    getWebhooks(auth.dbUser.id),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome back! Here&apos;s an overview of your API usage.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Requests" value={usage.summary.total_requests.toLocaleString()} />
        <StatCard title="Blocked" value={usage.summary.blocked.toLocaleString()} sub={`${(usage.summary.block_rate * 100).toFixed(1)}% block rate`} />
        <StatCard title="API Keys" value={String(apiKeys.length)} sub={`${apiKeys.filter((k) => k.isActive).length} active`} />
        <StatCard title="Webhooks" value={String(webhooks.length)} sub={webhooks.length > 0 ? "All healthy" : "None configured"} />
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
