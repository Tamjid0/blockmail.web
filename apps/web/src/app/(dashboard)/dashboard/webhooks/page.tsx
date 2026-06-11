import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserByClerkId } from "@/lib/services/user";
import { getWebhooks } from "@/lib/services/webhook";
import { WebhooksManager } from "./webhooks-manager";

export default async function WebhooksPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await getUserByClerkId(userId);
  if (!user) redirect("/sign-in");

  const webhooks = await getWebhooks(user.id);

  return <WebhooksManager initialWebhooks={webhooks} />;
}
