"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KeyStat {
  key_id: string;
  requests: number;
  blocked: number;
}

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
}

export function KeyBreakdown({
  byKey,
  apiKeys,
  onSelectKey,
  selectedKey,
}: {
  byKey: KeyStat[];
  apiKeys: ApiKey[];
  onSelectKey: (keyId: string | undefined) => void;
  selectedKey?: string;
}) {
  const getKeyDisplay = (keyId: string) => {
    const key = apiKeys.find((k) => k.id === keyId);
    return key ? { name: key.name, prefix: key.keyPrefix } : { name: "Unknown", prefix: keyId.slice(0, 8) };
  };

  const totalRequests = byKey.reduce((sum, k) => sum + k.requests, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-gray-900">Usage by API Key</CardTitle>
      </CardHeader>
      <CardContent>
        {byKey.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">No API key usage yet.</p>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => onSelectKey(undefined)}
              className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                !selectedKey ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div>
                <p className="text-sm font-medium text-gray-900">All Keys</p>
                <p className="text-xs text-gray-500">{apiKeys.length} keys total</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{totalRequests.toLocaleString()}</p>
                <p className="text-xs text-gray-500">requests</p>
              </div>
            </button>

            {byKey.map((stat) => {
              const display = getKeyDisplay(stat.key_id);
              const blockRate = stat.requests > 0 ? (stat.blocked / stat.requests) * 100 : 0;
              return (
                <button
                  key={stat.key_id}
                  onClick={() => onSelectKey(stat.key_id)}
                  className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                    selectedKey === stat.key_id ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{display.name}</p>
                    <p className="font-mono text-xs text-gray-500">{display.prefix}...</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{stat.requests.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">requests</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-red-600">{stat.blocked.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{blockRate.toFixed(1)}% blocked</p>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
