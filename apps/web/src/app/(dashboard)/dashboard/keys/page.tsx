"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  permissions: string[];
  rate_limit: number;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

const mockKeys: ApiKey[] = [
  {
    id: "key_1",
    name: "Production",
    prefix: "bm_live_a1b2",
    permissions: ["verify"],
    rate_limit: 1000,
    is_active: true,
    last_used_at: "2026-06-10T12:00:00Z",
    created_at: "2026-06-01T00:00:00Z",
  },
  {
    id: "key_2",
    name: "Staging",
    prefix: "bm_live_c3d4",
    permissions: ["verify"],
    rate_limit: 100,
    is_active: true,
    last_used_at: "2026-06-09T18:00:00Z",
    created_at: "2026-06-05T00:00:00Z",
  },
];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>(mockKeys);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyRateLimit, setNewKeyRateLimit] = useState("100");
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const handleCreateKey = async () => {
    const newKey: ApiKey = {
      id: `key_${Date.now()}`,
      name: newKeyName,
      prefix: `bm_live_${Math.random().toString(36).substring(2, 6)}`,
      permissions: ["verify"],
      rate_limit: parseInt(newKeyRateLimit),
      is_active: true,
      last_used_at: null,
      created_at: new Date().toISOString(),
    };
    setKeys([...keys, newKey]);
    setCreatedKey(`bm_live_${Math.random().toString(36).substring(2, 10)}`);
    setNewKeyName("");
    setNewKeyRateLimit("100");
  };

  const handleRevokeKey = async (keyId: string) => {
    setKeys(keys.filter((k) => k.id !== keyId));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your API keys for accessing the Blockmail API.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>Create API Key</Button>
      </div>

      {/* API Keys List */}
      <div className="space-y-4">
        {keys.map((key) => (
          <Card key={key.id}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                  <span className="text-lg">🔑</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{key.name}</h3>
                  <p className="text-sm text-gray-600">{key.prefix}...</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    Rate limit: {key.rate_limit}/min
                  </p>
                  <p className="text-xs text-gray-500">
                    Last used:{" "}
                    {key.last_used_at
                      ? new Date(key.last_used_at).toLocaleDateString()
                      : "Never"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      key.is_active
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {key.is_active ? "Active" : "Inactive"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevokeKey(key.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Revoke
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create API Key</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {createdKey ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-green-50 p-4">
                    <p className="text-sm font-medium text-green-800">
                      API Key Created
                    </p>
                    <p className="mt-1 text-sm text-green-700">
                      Copy this key now. It won&apos;t be shown again.
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-100 p-4">
                    <code className="text-sm text-gray-900">{createdKey}</code>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreatedKey(null);
                    }}
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Production"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rate_limit">Rate Limit (requests/minute)</Label>
                    <Input
                      id="rate_limit"
                      type="number"
                      value={newKeyRateLimit}
                      onChange={(e) => setNewKeyRateLimit(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowCreateModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleCreateKey}
                      disabled={!newKeyName}
                    >
                      Create
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
