import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getWebhooks } from "@/lib/services/webhook";
import { WebhooksManager } from "./webhooks-manager";

export default async function WebhooksPage() {
  const auth = await requireAuth();
  if (!auth) redirect("/sign-in");

  const webhooks = await getWebhooks(auth.dbUser.id);

  return <WebhooksManager initialWebhooks={webhooks} />;
}
