"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";
import { PlanCard } from "./plan-card";
import { DangerZone } from "./danger-zone";

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

      <ProfileForm
        userName={user.name}
        userEmail={user.email}
        loading={loading === "profile" ? "profile" : null}
        onSubmit={handleUpdateProfile}
      />

      <PasswordForm
        loading={loading === "password" ? "password" : null}
        onSubmit={handleChangePassword}
      />

      <PlanCard
        plan={user.plan}
        usage={usage}
        loading={loading === "upgrade" ? "upgrade" : loading === "portal" ? "portal" : null}
        onUpgrade={handleUpgrade}
        onPortal={handlePortal}
      />

      <DangerZone
        loading={loading === "delete" ? "delete" : null}
        onDelete={handleDeleteAccount}
      />
    </div>
  );
}
