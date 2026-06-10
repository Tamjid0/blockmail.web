"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Webhook {
  id: string;
  url: string;
  events: string[];
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
}

const mockWebhooks: Webhook[] = [
  {
    id: "wh_1",
    url: "https://api.example.com/webhooks/blockmail",
    events: ["email.blocked"],
    is_active: true,
    last_triggered_at: "2026-06-10T12:00:00Z",
    created_at: "2026-06-01T00:00:00Z",
  },
];

const availableEvents = ["email.blocked", "email.allowed", "key.created", "key.revoked"];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>(mockWebhooks);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>(["email.blocked"]);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  const handleCreateWebhook = async () => {
    const newWebhook: Webhook = {
      id: `wh_${Date.now()}`,
      url: newWebhookUrl,
      events: newWebhookEvents,
      is_active: true,
      last_triggered_at: null,
      created_at: new Date().toISOString(),
    };
    setWebhooks([...webhooks, newWebhook]);
    setCreatedSecret(`whsec_${Math.random().toString(36).substring(2, 18)}`);
    setNewWebhookUrl("");
    setNewWebhookEvents(["email.blocked"]);
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    setWebhooks(webhooks.filter((w) => w.id !== webhookId));
  };

  const toggleEvent = (event: string) => {
    if (newWebhookEvents.includes(event)) {
      setNewWebhookEvents(newWebhookEvents.filter((e) => e !== event));
    } else {
      setNewWebhookEvents([...newWebhookEvents, event]);
    }
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

      {/* Webhooks List */}
      <div className="space-y-4">
        {webhooks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-600">No webhooks configured yet.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowCreateModal(true)}
              >
                Create your first webhook
              </Button>
            </CardContent>
          </Card>
        ) : (
          webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                    <span className="text-lg">🔗</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{webhook.url}</h3>
                    <p className="text-sm text-gray-600">
                      Events: {webhook.events.join(", ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        webhook.is_active
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {webhook.is_active ? "Active" : "Inactive"}
                    </span>
                    <p className="mt-1 text-xs text-gray-500">
                      Last triggered:{" "}
                      {webhook.last_triggered_at
                        ? new Date(webhook.last_triggered_at).toLocaleDateString()
                        : "Never"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteWebhook(webhook.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Modal */}
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
                    <p className="text-sm font-medium text-green-800">
                      Webhook Created
                    </p>
                    <p className="mt-1 text-sm text-green-700">
                      Copy this secret now. It won&apos;t be shown again.
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-100 p-4">
                    <code className="text-sm text-gray-900">{createdSecret}</code>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreatedSecret(null);
                    }}
                  >
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
                      value={newWebhookUrl}
                      onChange={(e) => setNewWebhookUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Events</Label>
                    <div className="flex flex-wrap gap-2">
                      {availableEvents.map((event) => (
                        <button
                          key={event}
                          onClick={() => toggleEvent(event)}
                          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                            newWebhookEvents.includes(event)
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
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowCreateModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleCreateWebhook}
                      disabled={!newWebhookUrl || newWebhookEvents.length === 0}
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
