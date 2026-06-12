"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RequestLogEntry {
  id: string;
  email: string;
  domain: string;
  isDisposable: boolean;
  riskScore: number;
  reason: string;
  apiKeyId: string;
  latencyMs: number;
  createdAt: string;
}

interface RequestLogResponse {
  entries: RequestLogEntry[];
  total: number;
  page: number;
  totalPages: number;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${"*".repeat(Math.min(local.length - 2, 4))}${local.slice(-1)}@${domain}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function exportCsv(entries: RequestLogEntry[]) {
  const header = "Email,Domain,Status,Risk Score,Reason,Latency (ms),Date\n";
  const rows = entries.map((e) =>
    [e.email, e.domain, e.isDisposable ? "blocked" : "allowed", e.riskScore, e.reason, e.latencyMs, e.createdAt].join(",")
  );
  const blob = new Blob([header + rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `blockmail-requests-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function RequestLog({ apiKeyFilter }: { apiKeyFilter?: string }) {
  const [data, setData] = useState<RequestLogResponse | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "blocked" | "allowed">("all");
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const fetchLog = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams({ view: "log", page: String(page), limit: "20" });
    if (apiKeyFilter) params.set("key_id", apiKeyFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);

    try {
      const res = await fetch(`/api/usage?${params}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } finally {
      setIsLoading(false);
    }
  }, [page, apiKeyFilter, statusFilter]);

  useEffect(() => {
    fetchLog();
  }, [fetchLog]);

  useEffect(() => {
    setPage(1);
  }, [apiKeyFilter, statusFilter]);

  const toggleReveal = (id: string) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold text-gray-900">Request Log</CardTitle>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {(["all", "blocked", "allowed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          {data && data.entries.length > 0 && (
            <button
              onClick={() => exportCsv(data.entries)}
              className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200"
            >
              Export CSV
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="py-4 text-center text-sm text-gray-500">Loading...</p>}

        {!isLoading && (!data || data.entries.length === 0) && (
          <p className="py-8 text-center text-sm text-gray-500">No requests found.</p>
        )}

        {!isLoading && data && data.entries.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <th className="pb-3 pr-4">Email</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Risk</th>
                    <th className="pb-3 pr-4">Reason</th>
                    <th className="pb-3 pr-4">Latency</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.entries.map((entry) => (
                    <tr key={entry.id} className="text-gray-700">
                      <td className="whitespace-nowrap py-2.5 pr-4">
                        <button
                          onClick={() => toggleReveal(entry.id)}
                          className="font-mono text-xs hover:text-gray-900"
                          title="Click to reveal"
                        >
                          {revealed.has(entry.id) ? entry.email : maskEmail(entry.email)}
                        </button>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            entry.isDisposable
                              ? "bg-red-50 text-red-700"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          {entry.isDisposable ? "Blocked" : "Allowed"}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={`font-mono text-xs ${entry.riskScore >= 80 ? "text-red-600" : entry.riskScore >= 50 ? "text-amber-600" : "text-gray-600"}`}>
                          {entry.riskScore}
                        </span>
                      </td>
                      <td className="max-w-[200px] truncate py-2.5 pr-4 text-xs text-gray-600">
                        {entry.reason.replace(/_/g, " ")}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-gray-500">{entry.latencyMs}ms</td>
                      <td className="whitespace-nowrap py-2.5 text-xs text-gray-500">{formatDate(entry.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {data.total.toLocaleString()} total requests
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-gray-600">
                    Page {data.page} of {data.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                    disabled={page === data.totalPages}
                    className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
