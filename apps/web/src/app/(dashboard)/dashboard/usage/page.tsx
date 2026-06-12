import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getUsageStats } from "@/lib/services/usage";
import { getApiKeys } from "@/lib/services/key-management";
import { UsageDashboard } from "./usage-dashboard";

export default async function UsagePage() {
  const auth = await requireAuth();
  if (!auth) redirect("/sign-in");

  const [usage, apiKeys] = await Promise.all([
    getUsageStats(auth.dbUser.id, "30d"),
    getApiKeys(auth.dbUser.id),
  ]);

  return <UsageDashboard initialUsage={usage} apiKeys={apiKeys} />;
}
