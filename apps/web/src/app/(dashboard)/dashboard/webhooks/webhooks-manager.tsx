"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WebhookData {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggeredAt: Date | null;
  createdAt: Date;
}

const AVAILABLE_EVENTS = ["email.blocked", "email.allowed", "key.created", "key.revoked"];

export function WebhooksManager({ initialWebhooks }: { initialWebhooks: WebhookData[] }) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState<string[]>(["email.blocked"]);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!newUrl || newEvents.length === 0) return;
    setIsCreating(true);

    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl, events: newEvents }),
      });
      const data = await res.json();
      if (data.success) {
        setCreatedSecret(data.data.secret);
        setNewUrl("");
        setNewEvents(["email.blocked"]);
        router.refresh();
      }
    } catch {
      // handled
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/webhooks?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) router.refresh();
  };

  const toggleEvent = (event: string) => {
    setNewEvents((prev) => (prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Webhooks</h1>
          <p className="mt-1 text-sm text-gray-600">
            Receive real-time notifications when emails are verified.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>Create Webhook</Button>
      </div>

      <div className="space-y-4">
        {initialWebhooks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-500">No webhooks configured yet.</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowCreateModal(true)}>
                Create your first webhook
              </Button>
            </CardContent>
          </Card>
        ) : (
          initialWebhooks.map((wh) => (
            <Card key={wh.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                    <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{wh.url}</h3>
                    <p className="text-sm text-gray-600">Events: {wh.events.join(", ")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${wh.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                      {wh.isActive ? "Active" : "Inactive"}
                    </span>
                    <p className="mt-1 text-xs text-gray-500">
                      Last triggered: {wh.lastTriggeredAt ? new Date(wh.lastTriggeredAt).toLocaleDateString() : "Never"}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(wh.id)} className="text-red-600 hover:text-red-700">
                    Delete
                  </Button>
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
              <CardTitle>Create Webhook</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {createdSecret ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-green-50 p-4">
                    <p className="text-sm font-medium text-green-800">Webhook Created</p>
                    <p className="mt-1 text-sm text-green-700">
                      Copy this secret now. It won&apos;t be shown again.
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-100 p-4">
                    <code className="break-all text-sm text-gray-900">{createdSecret}</code>
                  </div>
                  <Button className="w-full" onClick={() => { setShowCreateModal(false); setCreatedSecret(null); }}>
                    Done
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="url">Endpoint URL</Label>
                    <Input
                      id="url"
                      placeholder="https://yourapp.com/webhooks/blockmail"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Events</Label>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_EVENTS.map((event) => (
                        <button
                          key={event}
                          onClick={() => toggleEvent(event)}
                          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                            newEvents.includes(event)
                              ? "bg-gray-900 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {event}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
                      Cancel
                    </Button>
                    <Button className="flex-1" onClick={handleCreate} disabled={!newUrl || newEvents.length === 0 || isCreating}>
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
