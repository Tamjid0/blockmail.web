import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome back! Here&apos;s an overview of your API usage.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Requests" value="12,456" change="+12% from last month" />
        <StatCard title="Blocked" value="2,341" change="18.8% block rate" />
        <StatCard title="API Keys" value="3" change="1 active" />
        <StatCard title="Webhooks" value="2" change="All healthy" />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Verifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ActivityRow
              email="user@example.com"
              status="allowed"
              riskScore={0}
              time="2 minutes ago"
            />
            <ActivityRow
              email="test@mailinator.com"
              status="blocked"
              riskScore={95}
              time="5 minutes ago"
            />
            <ActivityRow
              email="admin@tempmail.com"
              status="blocked"
              riskScore={90}
              time="8 minutes ago"
            />
            <ActivityRow
              email="contact@company.com"
              status="allowed"
              riskScore={0}
              time="12 minutes ago"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
}: {
  title: string;
  value: string;
  change: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <p className="text-xs text-gray-600">{change}</p>
      </CardContent>
    </Card>
  );
}

function ActivityRow({
  email,
  status,
  riskScore,
  time,
}: {
  email: string;
  status: "allowed" | "blocked";
  riskScore: number;
  time: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-4">
        <div
          className={`h-2 w-2 rounded-full ${
            status === "allowed" ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <div>
          <p className="text-sm font-medium text-gray-900">{email}</p>
          <p className="text-xs text-gray-600">{time}</p>
        </div>
      </div>
      <div className="text-right">
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            status === "allowed"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {status === "allowed" ? "Allowed" : "Blocked"}
        </span>
        <p className="mt-1 text-xs text-gray-600">Risk: {riskScore}</p>
      </div>
    </div>
  );
}
