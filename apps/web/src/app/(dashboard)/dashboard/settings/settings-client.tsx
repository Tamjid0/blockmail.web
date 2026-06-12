"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLAN_LIMITS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

interface UserData {
  id: string;
  name: string | null;
  email: string;
  plan: string;
  createdAt: string;
  stripeCustomerId: string | null;
}

interface UsageData {
  apiKeysCount: number;
  webhooksCount: number;
  totalRequests30d: number;
}

export function SettingsClient({
  user,
  usage,
}: {
  user: UserData;
  usage: UsageData;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState<"upgrade" | "portal" | "delete" | "profile" | "password" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const planLimits = PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.FREE;

  async function handleUpdateProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading("profile");
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Profile updated");
        router.refresh();
      } else {
        setError(data.error?.message ?? "Failed to update profile");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading("password");
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(null);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(null);
      return;
    }

    const { error: authError } = await supabase.auth.updateUser({ password });

    if (authError) {
      setError(authError.message);
      setLoading(null);
      return;
    }

    setSuccess("Password updated");
    setLoading(null);
    (e.target as HTMLFormElement).reset();
  }

  async function handleUpgrade() {
    setLoading("upgrade");
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const data = await res.json();
      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      } else {
        setError(data.error?.message ?? "Failed to start checkout");
        setLoading(null);
      }
    } catch {
      setError("Something went wrong");
      setLoading(null);
    }
  }

  async function handlePortal() {
    setLoading("portal");
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      } else {
        setError(data.error?.message ?? "Failed to open billing portal");
        setLoading(null);
      }
    } catch {
      setError("Something went wrong");
      setLoading(null);
    }
  }

  async function handleDeleteAccount() {
    if (!confirm("This action is irreversible. Type DELETE to confirm.")) return;
    setLoading("delete");
    setError(null);
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        window.location.href = "/sign-in";
      } else {
        setError(data.error?.message ?? "Failed to delete account");
        setLoading(null);
      }
    } catch {
      setError("Something went wrong");
      setLoading(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your account and subscription settings.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                defaultValue={user.name ?? ""}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
              />
              <p className="mt-1 text-xs text-gray-500">Contact support to change your email.</p>
            </div>
            <Button type="submit" variant="outline" disabled={loading === "profile"}>
              {loading === "profile" ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="newPassword"
                name="password"
                type="password"
                required
                minLength={8}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" variant="outline" disabled={loading === "password"}>
              {loading === "password" ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium text-gray-900">{user.plan} Plan</p>
              <p className="text-sm text-gray-600">
                {planLimits.requestsPerDay.toLocaleString()} requests/day
                {user.plan === "PRO" && " — $29/month"}
              </p>
            </div>
            <div className="flex gap-2">
              {user.plan === "FREE" ? (
                <Button onClick={handleUpgrade} disabled={loading === "upgrade"}>
                  {loading === "upgrade" ? "Redirecting..." : "Upgrade to Pro"}
                </Button>
              ) : (
                <Button variant="outline" onClick={handlePortal} disabled={loading === "portal"}>
                  {loading === "portal" ? "Redirecting..." : "Manage Billing"}
                </Button>
              )}
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <UsageStat label="API Keys" used={usage.apiKeysCount} limit={planLimits.maxApiKeys} />
            <UsageStat label="Webhooks" used={usage.webhooksCount} limit={planLimits.maxWebhooks} />
            <UsageStat label="Daily Requests (30d avg)" used={Math.round(usage.totalRequests30d / 30)} limit={planLimits.requestsPerDay} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Delete Account</p>
              <p className="text-sm text-gray-600">
                Permanently delete your account and all associated data.
              </p>
            </div>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={loading === "delete"}>
              {loading === "delete" ? "Deleting..." : "Delete Account"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UsageStat({ label, used, limit }: { label: string; used: number; limit: number }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-lg font-medium text-gray-900">{used} / {limit.toLocaleString()}</p>
    </div>
  );
}
