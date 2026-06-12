"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLAN_LIMITS } from "@/lib/constants";

interface PlanCardProps {
  plan: string;
  usage: {
    apiKeysCount: number;
    webhooksCount: number;
    totalRequests30d: number;
  };
  loading: "upgrade" | "portal" | null;
  onUpgrade: () => Promise<void>;
  onPortal: () => Promise<void>;
}

function UsageStat({ label, used, limit }: { label: string; used: number; limit: number }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-lg font-medium text-gray-900">{used} / {limit.toLocaleString()}</p>
    </div>
  );
}

export function PlanCard({ plan, usage, loading, onUpgrade, onPortal }: PlanCardProps) {
  const planLimits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.FREE;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Plan</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-medium text-gray-900">{plan} Plan</p>
            <p className="text-sm text-gray-600">
              {planLimits.requestsPerDay.toLocaleString()} requests/day
              {plan === "PRO" && " — $29/month"}
            </p>
          </div>
          <div className="flex gap-2">
            {plan === "FREE" ? (
              <Button onClick={onUpgrade} disabled={loading === "upgrade"}>
                {loading === "upgrade" ? "Redirecting..." : "Upgrade to Pro"}
              </Button>
            ) : (
              <Button variant="outline" onClick={onPortal} disabled={loading === "portal"}>
                {loading === "portal" ? "Redirecting..." : "Manage Billing"}
              </Button>
            )}
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <UsageStat label="API Keys" used={usage.apiKeysCount} limit={planLimits.maxApiKeys} />
          <UsageStat label="Webhooks" used={usage.webhooksCount} limit={planLimits.maxWebhooks} />
          <UsageStat label="Daily Requests (30d avg)" used={Math.round(usage.totalRequests30d / 30)} limit={planLimits.requestsPerDay} />
        </div>
      </CardContent>
    </Card>
  );
}
