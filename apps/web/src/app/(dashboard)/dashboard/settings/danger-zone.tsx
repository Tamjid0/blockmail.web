"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DangerZoneProps {
  loading: "delete" | null;
  onDelete: () => Promise<void>;
}

export function DangerZone({ loading, onDelete }: DangerZoneProps) {
  return (
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
          <Button variant="destructive" onClick={onDelete} disabled={loading === "delete"}>
            {loading === "delete" ? "Deleting..." : "Delete Account"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
