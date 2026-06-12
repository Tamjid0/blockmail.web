import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getApiKeys } from "@/lib/services/apikey";
import { getWebhooks } from "@/lib/services/webhook";
import { getUsageStats } from "@/lib/services/usage";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const auth = await requireAuth();
  if (!auth) redirect("/sign-in");

  const user = auth.dbUser;
  const [apiKeys, webhooks, usage] = await Promise.all([
    getApiKeys(user.id),
    getWebhooks(user.id),
    getUsageStats(user.id, "30d"),
  ]);

  return (
    <SettingsClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        createdAt: user.createdAt.toISOString(),
        stripeCustomerId: user.stripeCustomerId,
      }}
      usage={{
        apiKeysCount: apiKeys.length,
        webhooksCount: webhooks.length,
        totalRequests30d: usage.summary.total_requests,
      }}
    />
  );
}
