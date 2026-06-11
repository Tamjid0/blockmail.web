import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserByClerkId } from "@/lib/services/user";
import { getApiKeys } from "@/lib/services/apikey";
import { KeysManager } from "./keys-manager";

export default async function ApiKeysPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await getUserByClerkId(userId);
  if (!user) redirect("/sign-in");

  const keys = await getApiKeys(user.id);

  return <KeysManager initialKeys={keys} />;
}
