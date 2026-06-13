import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getAuditLogs } from "@/lib/audit";
import { AuditLogViewer } from "./audit-log-viewer";

export default async function AuditPage() {
  const auth = await requireAuth();
  if (!auth) redirect("/sign-in");

  const rawLogs = await getAuditLogs({ userId: auth.dbUser.id, limit: 100 });
  const logs = rawLogs.map((l) => ({ ...l, details: l.details as Record<string, unknown> | null }));

  return <AuditLogViewer initialLogs={logs} />;
}
