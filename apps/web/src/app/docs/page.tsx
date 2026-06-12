"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { endpoints, rateLimitData, errorCodes } from "./data";
import { DocsSidebar } from "./docs-sidebar";
import { EndpointCard } from "./endpoint-card";
import { CodeExamples } from "./code-examples";

export default function DocsPage() {
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50/50">
      <Header />

      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-[240px_1fr]">
            <DocsSidebar endpoints={endpoints} />

            <div className="min-w-0 space-y-16">
              <section id="introduction">
                <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                  API Documentation
                </h1>
                <p className="mt-3 text-gray-500">
                  Verify email addresses and detect disposable providers with our 6-tier verification engine.
                </p>
              </section>

              <section id="authentication">
                <h2 className="text-xl font-semibold text-gray-900">Authentication</h2>
                <p className="mt-2 text-sm text-gray-500">
                  All API requests require an API key passed via the <code className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-700">X-API-Key</code> header.
                </p>
                <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4">
                  <pre className="overflow-x-auto text-sm text-gray-700">
                    <code>X-API-Key: bm_live_your_api_key_here</code>
                  </pre>
                </div>
                <p className="mt-3 text-sm text-gray-500">
                  You can generate API keys from your{" "}
                  <Link href="/dashboard/keys" className="text-gray-900 underline underline-offset-2">
                    dashboard
                  </Link>
                  .
                </p>
              </section>

              <section id="base-url">
                <h2 className="text-xl font-semibold text-gray-900">Base URL</h2>
                <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4">
                  <pre className="overflow-x-auto text-sm text-gray-700">
                    <code>https://api.blockmail.dev</code>
                  </pre>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900">Endpoints</h2>
                <div className="mt-6 space-y-4">
                  {endpoints.map((ep) => (
                    <EndpointCard
                      key={ep.path}
                      endpoint={ep}
                      isExpanded={expandedEndpoint === ep.path}
                      onToggle={() => setExpandedEndpoint(expandedEndpoint === ep.path ? null : ep.path)}
                    />
                  ))}
                </div>
              </section>

              <CodeExamples />

              <section>
                <h2 className="text-xl font-semibold text-gray-900">Rate Limits</h2>
                <div className="mt-4 overflow-hidden rounded-xl border border-gray-100 bg-white">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-50 bg-gray-50/50">
                        <th className="px-4 py-2.5 font-medium text-gray-500">Plan</th>
                        <th className="px-4 py-2.5 font-medium text-gray-500">Requests/min</th>
                        <th className="px-4 py-2.5 font-medium text-gray-500">Requests/day</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {rateLimitData.map((row) => (
                        <tr key={row.plan}>
                          <td className="px-4 py-2.5 text-gray-900">{row.plan}</td>
                          <td className="px-4 py-2.5 text-gray-600">{row.perMinute}</td>
                          <td className="px-4 py-2.5 text-gray-600">{row.perDay}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900">Error Codes</h2>
                <div className="mt-4 overflow-hidden rounded-xl border border-gray-100 bg-white">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-50 bg-gray-50/50">
                        <th className="px-4 py-2.5 font-medium text-gray-500">Code</th>
                        <th className="px-4 py-2.5 font-medium text-gray-500">Status</th>
                        <th className="px-4 py-2.5 font-medium text-gray-500">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {errorCodes.map((row) => (
                        <tr key={row.code}>
                          <td className="px-4 py-2.5 font-mono text-xs text-gray-900">{row.code}</td>
                          <td className="px-4 py-2.5 text-gray-600">{row.status}</td>
                          <td className="px-4 py-2.5 text-gray-600">{row.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-100 bg-white py-6">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">
            Back to Home
          </Link>
        </div>
      </footer>
    </div>
  );
}
