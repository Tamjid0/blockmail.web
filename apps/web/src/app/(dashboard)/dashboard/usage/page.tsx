import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserByClerkId } from "@/lib/services/user";
import { getUsageStats } from "@/lib/services/usage";
import { UsageDashboard } from "./usage-dashboard";

export default async function UsagePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await getUserByClerkId(userId);
  if (!user) redirect("/sign-in");

  const usage = await getUsageStats(user.id, "30d");

  return <UsageDashboard initialUsage={usage} />;
}
