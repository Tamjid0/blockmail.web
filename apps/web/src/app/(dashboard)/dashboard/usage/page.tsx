import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getUsageStats } from "@/lib/services/usage";
import { UsageDashboard } from "./usage-dashboard";

export default async function UsagePage() {
  const auth = await requireAuth();
  if (!auth) redirect("/sign-in");

  const usage = await getUsageStats(auth.dbUser.id, "30d");

  return <UsageDashboard initialUsage={usage} />;
}
