"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Period = "7d" | "30d" | "90d";

interface DailyData {
  date: string;
  requests: number;
  blocked: number;
  allowed: number;
}

interface UsageData {
  summary: {
    total_requests: number;
    blocked: number;
    allowed: number;
    block_rate: number;
  };
  daily: DailyData[];
  by_reason: { reason: string; count: number }[];
}

export function UsageDashboard({ initialUsage }: { initialUsage: UsageData }) {
  const [period, setPeriod] = useState<Period>("30d");
  const [usage, setUsage] = useState<UsageData>(initialUsage);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/usage?period=${period}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUsage(data.data);
      })
      .finally(() => setIsLoading(false));
  }, [period]);

  const maxDaily = Math.max(...usage.daily.map((d) => d.requests), 1);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usage</h1>
          <p className="mt-1 text-sm text-gray-600">
            Monitor your API usage and verification statistics.
          </p>
        </div>
        <div className="flex gap-2">
          {(["7d", "30d", "90d"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                period === p
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <p className="text-sm text-gray-500">Loading...</p>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard title="Total Requests" value={usage.summary.total_requests.toLocaleString()} />
        <SummaryCard title="Allowed" value={usage.summary.allowed.toLocaleString()} valueClass="text-green-600" />
        <SummaryCard title="Blocked" value={usage.summary.blocked.toLocaleString()} valueClass="text-red-600" />
        <SummaryCard title="Block Rate" value={`${(usage.summary.block_rate * 100).toFixed(1)}%`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {usage.daily.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No usage data yet.</p>
          ) : (
            <>
              <div className="flex items-end gap-1" style={{ height: "200px" }}>
                {usage.daily.map((day) => (
                  <div
                    key={day.date}
                    className="flex flex-1 flex-col justify-end gap-1"
                    style={{ height: "100%" }}
                  >
                    <div
                      className="rounded-t bg-green-500"
                      style={{ height: `${(day.allowed / maxDaily) * 100}%`, minHeight: day.allowed > 0 ? "2px" : "0" }}
                      title={`Allowed: ${day.allowed}`}
                    />
                    <div
                      className="rounded-b bg-red-500"
                      style={{ height: `${(day.blocked / maxDaily) * 100}%`, minHeight: day.blocked > 0 ? "2px" : "0" }}
                      title={`Blocked: ${day.blocked}`}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between text-xs text-gray-500">
                <span>{usage.daily[0]?.date}</span>
                <span>{usage.daily[usage.daily.length - 1]?.date}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Block Reasons</CardTitle>
        </CardHeader>
        <CardContent>
          {usage.by_reason.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">No block reasons yet.</p>
          ) : (
            <div className="space-y-4">
              {usage.by_reason.map((reason) => (
                <div key={reason.reason} className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {reason.reason.replace(/_/g, " ")}
                    </p>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full bg-red-500"
                        style={{ width: `${(reason.count / (usage.by_reason[0]?.count ?? 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-gray-600">{reason.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ title, value, valueClass }: { title: string; value: string; valueClass?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueClass ?? "text-gray-900"}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
