"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthConfirmPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const { searchParams } = new URL(window.location.href);
    const token = searchParams.get("token");
    const type = searchParams.get("type");

    if (token && type) {
      supabase.auth.verifyOtp({ token_hash: token, type: type as "signup" | "magiclink" | "recovery" })
        .then(({ error }) => {
          if (error) {
            router.push("/sign-in?error=verification_failed");
          } else {
            router.push("/dashboard?verified=true");
          }
          router.refresh();
        });
    } else {
      router.push("/sign-in");
    }
  }, [router, supabase]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <p className="text-sm text-gray-600">Verifying...</p>
    </div>
  );
}
