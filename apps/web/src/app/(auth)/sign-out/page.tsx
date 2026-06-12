"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function signOut() {
      await supabase.auth.signOut();
      window.location.href = "/";
    }
    signOut();
  }, [supabase]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <p className="text-sm text-gray-600">Signing out...</p>
    </div>
  );
}
