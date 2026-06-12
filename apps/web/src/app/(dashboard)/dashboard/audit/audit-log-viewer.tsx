"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AuditLog {
  id: string;
  action: string;
  severity: string;
  userId: string | null;
  apiKeyId: string | null;
  ip: string | null;
  details: Record<string, unknown> | null;
  createdAt: Date;
}

const SEVERITY_STYLES: Record<string, string> = {
  info: "bg-blue-50 text-blue-700",
  warn: "bg-amber-50 text-amber-700",
  error: "bg-red-50 text-red-700",
};

const ACTION_LABELS: Record<string, string> = {
  "api_key.created": "API Key Created",
  "api_key.revoked": "API Key Revoked",
  "api_key.deleted": "API Key Deleted",
  "api_key.used": "API Key Used",
  "api_key.invalid": "API Key Invalid",
  "webhook.created": "Webhook Created",
  "webhook.deleted": "Webhook Deleted",
  "webhook.delivered": "Webhook Delivered",
  "webhook.failed": "Webhook Failed",
  "rate_limit.hit": "Rate Limit Hit",
  "daily_limit.hit": "Daily Limit Hit",
  "auth.success": "Auth Success",
  "auth.failure": "Auth Failure",
};

export function AuditLogViewer({ initialLogs }: { initialLogs: AuditLog[] }) {
  const [filter, setFilter] = useState<string>("all");

  const filteredLogs = filter === "all"
    ? initialLogs
    : initialLogs.filter((log) => log.severity === filter);

  const severityCounts = {
    info: initialLogs.filter((l) => l.severity === "info").length,
    warn: initialLogs.filter((l) => l.severity === "warn").length,
    error: initialLogs.filter((l) => l.severity === "error").length,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="mt-1 text-sm text-gray-600">
          Track all activity on your account.
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All ({initialLogs.length})
        </Button>
        <Button
          variant={filter === "info" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("info")}
        >
          Info ({severityCounts.info})
        </Button>
        <Button
          variant={filter === "warn" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("warn")}
        >
          Warning ({severityCounts.warn})
        </Button>
        <Button
          variant={filter === "error" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("error")}
        >
          Error ({severityCounts.error})
        </Button>
      </div>

      <Card>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No audit logs found.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredLogs.map((log) => (
                <div key={log.id} className="flex items-start justify-between py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_STYLES[log.severity] ?? "bg-gray-100 text-gray-700"}`}>
                      {log.severity}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {ACTION_LABELS[log.action] ?? log.action}
                      </p>
                      <div className="mt-1 flex gap-4 text-xs text-gray-500">
                        {log.apiKeyId && <span>Key: {log.apiKeyId.slice(0, 8)}...</span>}
                        {log.ip && <span>IP: {log.ip}</span>}
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <pre className="mt-2 whitespace-pre-wrap rounded bg-gray-50 p-2 text-xs text-gray-600">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
