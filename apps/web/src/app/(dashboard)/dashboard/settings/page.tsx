"use client";

import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { user } = useUser();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your account and subscription settings.
        </p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gray-200">
              {user?.imageUrl && (
                <img
                  src={user.imageUrl}
                  alt="Profile"
                  className="h-full w-full rounded-full"
                />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {user?.fullName || "User"}
              </p>
              <p className="text-sm text-gray-600">
                {user?.emailAddresses?.[0]?.emailAddress}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium text-gray-900">Free Plan</p>
              <p className="text-sm text-gray-600">
                100 requests/day • 2 API keys • 1 webhook
              </p>
            </div>
            <Button>Upgrade to Pro</Button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">API Keys</p>
              <p className="text-lg font-medium text-gray-900">1 / 2</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Webhooks</p>
              <p className="text-lg font-medium text-gray-900">0 / 1</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Daily Requests</p>
              <p className="text-lg font-medium text-gray-900">45 / 100</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
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
            <Button variant="destructive">Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
