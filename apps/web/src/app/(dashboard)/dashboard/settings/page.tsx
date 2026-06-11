import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getUserByClerkId } from "@/lib/services/user";
import { getApiKeys } from "@/lib/services/apikey";
import { getWebhooks } from "@/lib/services/webhook";
import { getUsageStats } from "@/lib/services/usage";
import { PLAN_LIMITS } from "@/lib/constants";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await getUserByClerkId(userId);
  if (!user) redirect("/sign-in");

  const [apiKeys, webhooks, usage] = await Promise.all([
    getApiKeys(user.id),
    getWebhooks(user.id),
    getUsageStats(user.id, "30d"),
  ]);

  const planLimits = PLAN_LIMITS[user.plan];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your account and subscription settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gray-200" />
            <div>
              <p className="font-medium text-gray-900">{user.name ?? "User"}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
              <p className="text-xs text-gray-500">Member since {user.createdAt.toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium text-gray-900">{user.plan} Plan</p>
              <p className="text-sm text-gray-600">
                {planLimits.requestsPerDay.toLocaleString()} requests/day
              </p>
            </div>
            <Button disabled>Upgrade to Pro</Button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <UsageStat label="API Keys" used={apiKeys.length} limit={planLimits.maxApiKeys} />
            <UsageStat label="Webhooks" used={webhooks.length} limit={planLimits.maxWebhooks} />
            <UsageStat label="Daily Requests (30d avg)" used={Math.round(usage.summary.total_requests / 30)} limit={planLimits.requestsPerDay} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Delete Account</p>
              <p className="text-sm text-gray-600">
                Permanently delete your account and all associated data.
              </p>
            </div>
            <Button variant="destructive">Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UsageStat({ label, used, limit }: { label: string; used: number; limit: number }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-lg font-medium text-gray-900">{used} / {limit.toLocaleString()}</p>
    </div>
  );
}
