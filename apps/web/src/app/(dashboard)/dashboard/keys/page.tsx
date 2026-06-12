import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getApiKeys } from "@/lib/services/key-management";
import { KeysManager } from "./keys-manager";

export default async function ApiKeysPage() {
  const auth = await requireAuth();
  if (!auth) redirect("/sign-in");

  const keys = await getApiKeys(auth.dbUser.id);

  return <KeysManager initialKeys={keys} />;
}
