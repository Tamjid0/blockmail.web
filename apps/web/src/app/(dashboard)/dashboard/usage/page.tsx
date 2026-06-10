"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Period = "7d" | "30d" | "90d";

const mockUsage = {
  summary: {
    total_requests: 15420,
    blocked: 3200,
    allowed: 12220,
    block_rate: 0.207,
  },
  daily: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    requests: Math.floor(Math.random() * 1000) + 200,
    blocked: Math.floor(Math.random() * 200) + 50,
    allowed: Math.floor(Math.random() * 800) + 150,
  })),
  by_reason: [
    { reason: "domain_blocklist_hit", count: 2100 },
    { reason: "infra_fingerprint_hit", count: 800 },
    { reason: "behavioral_context_hit", count: 300 },
  ],
};

export default function UsagePage() {
  const [period, setPeriod] = useState<Period>("30d");

  const maxDaily = Math.max(...mockUsage.daily.map((d) => d.requests));

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

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {mockUsage.summary.total_requests.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Allowed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {mockUsage.summary.allowed.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Blocked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {mockUsage.summary.blocked.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Block Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {(mockUsage.summary.block_rate * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1" style={{ height: "200px" }}>
            {mockUsage.daily.map((day) => (
              <div
                key={day.date}
                className="flex flex-1 flex-col justify-end gap-1"
                style={{ height: "100%" }}
              >
                <div
                  className="rounded-t bg-green-500"
                  style={{
                    height: `${(day.allowed / maxDaily) * 100}%`,
                    minHeight: "2px",
                  }}
                  title={`Allowed: ${day.allowed}`}
                />
                <div
                  className="rounded-b bg-red-500"
                  style={{
                    height: `${(day.blocked / maxDaily) * 100}%`,
                    minHeight: "2px",
                  }}
                  title={`Blocked: ${day.blocked}`}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between text-xs text-gray-500">
            <span>{mockUsage.daily[0].date}</span>
            <span>{mockUsage.daily[mockUsage.daily.length - 1].date}</span>
          </div>
        </CardContent>
      </Card>

      {/* Block Reasons */}
      <Card>
        <CardHeader>
          <CardTitle>Top Block Reasons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockUsage.by_reason.map((reason) => (
              <div key={reason.reason} className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {reason.reason.replace(/_/g, " ")}
                  </p>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full bg-red-500"
                      style={{
                        width: `${(reason.count / mockUsage.by_reason[0].count) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-sm text-gray-600">
                  {reason.count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
