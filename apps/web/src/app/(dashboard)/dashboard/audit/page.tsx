import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getAuditLogs } from "@/lib/audit";
import { AuditLogViewer } from "./audit-log-viewer";

export default async function AuditPage() {
  const auth = await requireAuth();
  if (!auth) redirect("/sign-in");

  const logs = await getAuditLogs({ userId: auth.dbUser.id, limit: 100 });

  return <AuditLogViewer initialLogs={logs} />;
}
