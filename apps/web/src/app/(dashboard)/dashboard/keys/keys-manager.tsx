"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
      title="Copy to clipboard"
    >
      {copied ? (
        <>
          <CheckIcon className="h-3.5 w-3.5 text-green-600" />
          <span className="text-green-600">Copied</span>
        </>
      ) : (
        <>
          <CopyIcon className="h-3.5 w-3.5" />
          {label && <span>{label}</span>}
        </>
      )}
    </button>
  );
}

interface ApiKeyData {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  rateLimit: number;
  dailyLimit: number;
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
}

export function KeysManager({ initialKeys }: { initialKeys: ApiKeyData[] }) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyRateLimit, setNewKeyRateLimit] = useState("100");
  const [newKeyDailyLimit, setNewKeyDailyLimit] = useState("1000");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);

  const handleCreateKey = async () => {
    if (!newKeyName) return;
    setIsCreating(true);

    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName,
          permissions: ["verify"],
          rate_limit: parseInt(newKeyRateLimit),
          daily_limit: parseInt(newKeyDailyLimit),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCreatedKey(data.data.key);
        setNewKeyName("");
        setNewKeyRateLimit("100");
        setNewKeyDailyLimit("1000");
        router.refresh();
      }
    } catch {
      // Error handled silently
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    setIsRevoking(keyId);

    try {
      const res = await fetch(`/api/keys?id=${keyId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        router.refresh();
      }
    } catch {
      // Error handled silently
    } finally {
      setIsRevoking(null);
    }
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

      <div className="space-y-4">
        {initialKeys.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">No API keys yet. Create your first key to get started.</p>
            </CardContent>
          </Card>
        ) : (
          initialKeys.map((key) => (
            <Card key={key.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                    <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{key.name}</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono text-gray-600">{key.keyPrefix}...</p>
                      <CopyButton text={key.keyPrefix} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      Rate: {key.rateLimit}/min | Daily: {key.dailyLimit.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Last used: {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : "Never"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${key.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                      {key.isActive ? "Active" : "Revoked"}
                    </span>
                    {key.isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeKey(key.id)}
                        disabled={isRevoking === key.id}
                        className="text-red-600 hover:text-red-700"
                      >
                        {isRevoking === key.id ? "Revoking..." : "Revoke"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

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
                    <p className="text-sm font-medium text-green-800">API Key Created</p>
                    <p className="mt-1 text-sm text-green-700">
                      Copy this key now. It won&apos;t be shown again.
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-100 p-4">
                    <code className="break-all text-sm text-gray-900">{createdKey}</code>
                  </div>
                  <CopyButton text={createdKey} label="Copy full key" />
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rate_limit">Rate Limit (/min)</Label>
                      <Input
                        id="rate_limit"
                        type="number"
                        value={newKeyRateLimit}
                        onChange={(e) => setNewKeyRateLimit(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="daily_limit">Daily Limit</Label>
                      <Input
                        id="daily_limit"
                        type="number"
                        value={newKeyDailyLimit}
                        onChange={(e) => setNewKeyDailyLimit(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
                      Cancel
                    </Button>
                    <Button className="flex-1" onClick={handleCreateKey} disabled={!newKeyName || isCreating}>
                      {isCreating ? "Creating..." : "Create"}
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
