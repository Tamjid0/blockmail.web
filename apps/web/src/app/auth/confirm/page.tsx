"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Status = "loading" | "success" | "error";

export default function AuthConfirmPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const supabase = createClient();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.slice(1));

    // Check for Supabase error params (expired/invalid link)
    const error = searchParams.get("error") || hashParams.get("error");
    const errorDescription = searchParams.get("error_description") || hashParams.get("error_description");

    if (error) {
      setStatus("error");
      setMessage(errorDescription || "This verification link is invalid or has expired.");
      return;
    }

    async function check() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setStatus("error");
        setMessage("You are not signed in. Please sign up or sign in first.");
        return;
      }

      if (session.user.email_confirmed_at) {
        // Verified — sync to our DB
        await fetch("/api/auth/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supabaseId: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || null,
          }),
        });
        setStatus("success");
        setMessage("Your email has been verified! Welcome to Blockmail.");
      } else {
        setStatus("error");
        setMessage("Your email is not yet verified. Please check your inbox for the confirmation link.");
      }
    }

    check();
  }, [supabase]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <Link href="/" className="text-2xl font-bold text-gray-900">
          Blockmail
        </Link>

        {status === "loading" && (
          <div className="space-y-4">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
            <p className="text-sm text-gray-600">Checking your account...</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">You're all set!</h1>
            <p className="text-sm text-gray-600">{message}</p>
            <a
              href="/dashboard"
              className="inline-block w-full rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Go to Dashboard
            </a>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Not Verified</h1>
            <p className="text-sm text-gray-600">{message}</p>
            <a
              href="/sign-in"
              className="inline-block w-full rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Go to Sign In
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
