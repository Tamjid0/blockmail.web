"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DomainStat {
  domain: string;
  total: number;
  blocked: number;
  allowed: number;
}

export function DomainStats({ byDomain }: { byDomain: DomainStat[] }) {
  const maxCount = Math.max(...byDomain.map((d) => d.total), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-gray-900">Top Domains</CardTitle>
      </CardHeader>
      <CardContent>
        {byDomain.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">No domain data yet.</p>
        ) : (
          <div className="space-y-3">
            {byDomain.map((d) => {
              const blockRate = d.total > 0 ? (d.blocked / d.total) * 100 : 0;
              return (
                <div key={d.domain} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{d.domain}</p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-500">{d.total.toLocaleString()} total</span>
                      <span className="text-red-600">{d.blocked.toLocaleString()} blocked</span>
                    </div>
                  </div>
                  <div className="flex h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="bg-red-500"
                      style={{ width: `${(d.blocked / maxCount) * 100}%` }}
                    />
                    <div
                      className="bg-green-500"
                      style={{ width: `${(d.allowed / maxCount) * 100}%` }}
                    />
                  </div>
                  <p className="text-right text-[10px] text-gray-400">{blockRate.toFixed(0)}% block rate</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
