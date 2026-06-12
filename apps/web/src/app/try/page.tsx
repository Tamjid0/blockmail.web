"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";

interface VerifyResult {
  email: string;
  is_disposable: boolean;
  is_valid: boolean;
  risk_score: number;
  tier_results: {
    tier: number;
    name: string;
    passed: boolean;
    details: string;
  }[];
  recommendation: string;
}

export default function TryPage() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/v1/try", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Verification failed");
        return;
      }

      setResult(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getVerdictColor = () => {
    if (result?.is_disposable) return "text-red-600";
    if (result?.is_valid) return "text-emerald-600";
    return "text-amber-600";
  };

  const getRiskColor = () => {
    if (!result) return "text-gray-900";
    if (result.risk_score >= 70) return "text-red-600";
    if (result.risk_score >= 40) return "text-amber-600";
    return "text-emerald-600";
  };

  const getRiskBarColor = () => {
    if (!result) return "bg-gray-200";
    if (result.risk_score >= 70) return "bg-red-500";
    if (result.risk_score >= 40) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getVerdictBg = () => {
    if (result?.is_disposable) return "bg-red-50 border-red-100";
    if (result?.is_valid) return "bg-emerald-50 border-emerald-100";
    return "bg-amber-50 border-amber-100";
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50/50">
      {/* Header */}
      <Header />

      {/* Main */}
      <main className="flex-1 px-6 py-16">
        <div className="mx-auto max-w-xl">
          {/* Title */}
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Test Our Engine
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Enter any email to check if it&apos;s disposable. No signup required.
            </p>
          </div>

          {/* Input */}
          <form onSubmit={handleVerify} className="relative">
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-4 pr-28 text-sm text-gray-900 shadow-sm outline-none transition-shadow placeholder:text-gray-400 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-1.5 top-1.5 h-9 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Checking
                </span>
              ) : (
                "Check"
              )}
            </button>
          </form>

          {/* Examples */}
          {!result && !loading && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-gray-400">
              <span>Try:</span>
              {["test@mailinator.com", "user@gmail.com", "admin@company.org", "hello@tempmail.com"].map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setEmail(ex)}
                  className="rounded-md border border-gray-100 bg-white px-2 py-1 text-gray-500 transition-colors hover:border-gray-200 hover:text-gray-700"
                >
                  {ex}
                </button>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="mt-8 space-y-4">
              {/* Verdict */}
              <div className={`rounded-2xl border p-6 text-center ${getVerdictBg()}`}>
                <div className={`text-4xl font-bold tracking-tight ${getVerdictColor()}`}>
                  {result.is_disposable ? "DISPOSABLE" : result.is_valid ? "SAFE" : "INVALID"}
                </div>
                <p className="mt-1.5 text-sm text-gray-500">
                  {result.email}
                </p>
              </div>

              {/* Risk */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Risk Score
                  </span>
                  <span className={`text-xl font-bold tabular-nums ${getRiskColor()}`}>
                    {result.risk_score}
                  </span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getRiskBarColor()}`}
                    style={{ width: `${result.risk_score}%` }}
                  />
                </div>
              </div>

              {/* Tiers */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5">
                <div className="mb-4 text-xs font-medium uppercase tracking-wider text-gray-400">
                  Verification Pipeline
                </div>
                <div className="space-y-0">
                  {result.tier_results.map((tier, i) => (
                    <div key={tier.tier}>
                      <div className="flex items-center gap-3 py-2.5">
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                            tier.passed
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {tier.tier}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {tier.name}
                            </span>
                            {!tier.passed && (
                              <span className="inline-flex items-center rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
                                BLOCKED
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-gray-400 truncate">
                            {tier.details}
                          </p>
                        </div>
                      </div>
                      {i < result.tier_results.length - 1 && (
                        <div className="ml-3.5 h-2 w-px bg-gray-100" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendation */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5">
                <div className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                  Recommendation
                </div>
                <p className="text-sm leading-relaxed text-gray-600">
                  {result.recommendation}
                </p>
              </div>

              {/* Reset */}
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setEmail("");
                }}
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
              >
                Check Another Email
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-6">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">
            Back to Home
          </Link>
        </div>
      </footer>
    </div>
  );
}
