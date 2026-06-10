"use client";

import { useState } from "react";
import Link from "next/link";

type HttpMethod = "GET" | "POST" | "DELETE";

interface Endpoint {
  method: HttpMethod;
  path: string;
  title: string;
  description: string;
  auth: boolean;
  requestExample: string;
  responseExample: string;
}

const endpoints: Endpoint[] = [
  {
    method: "POST",
    path: "/v1/verify",
    title: "Verify Email",
    description:
      "Check if an email address is disposable. Returns verification result with risk score and tier analysis.",
    auth: true,
    requestExample: `{
  "email": "user@example.com"
}`,
    responseExample: `{
  "email": "user@example.com",
  "is_disposable": false,
  "risk_score": 0,
  "analysis": {
    "tier_triggered": 0,
    "reason": "allowed",
    "domain": "example.com"
  }
}`,
  },
  {
    method: "GET",
    path: "/v1/lists/stats",
    title: "Blocklist Stats",
    description:
      "Get statistics about the disposable email blocklist. Returns total domains tracked and last update time.",
    auth: true,
    requestExample: "",
    responseExample: `{
  "total_domains": 30278,
  "last_updated": "2026-06-10T19:05:03Z"
}`,
  },
  {
    method: "GET",
    path: "/healthz",
    title: "Health Check",
    description:
      "Check if the service is healthy. Returns connectivity status for Redis and local storage.",
    auth: false,
    requestExample: "",
    responseExample: `{
  "status": "healthy",
  "redis": "connected",
  "storage": "connected"
}`,
  },
];

const methodColors: Record<HttpMethod, string> = {
  GET: "bg-emerald-100 text-emerald-700",
  POST: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
};

const codeExamples: Record<string, { label: string; code: string }[]> = {
  curl: [
    {
      label: "Verify Email",
      code: [
        "curl -X POST https://api.blockmail.dev/v1/verify \\",
        '  -H "X-API-Key: your_api_key" \\',
        '  -H "Content-Type: application/json" \\',
        "  -d " + String.raw`'{"email": "user@example.com"}'`,
      ].join("\n"),
    },
  ],
  node: [
    {
      label: "Verify Email",
      code: [
        "import Blockmail from '@blockmail/sdk';",
        "",
        "const client = new Blockmail('your_api_key');",
        "",
        "const result = await client.verify('user@example.com');",
        "",
        "if (result.is_disposable) {",
        "  console.log('Blocked disposable email');",
        "}",
      ].join("\n"),
    },
  ],
  python: [
    {
      label: "Verify Email",
      code: [
        'from blockmail import Blockmail',
        "",
        'client = Blockmail(api_key="your_api_key")',
        "",
        'result = client.verify("user@example.com")',
        "",
        "if result.is_disposable:",
        '    print("Blocked disposable email")',
      ].join("\n"),
    },
  ],
  go: [
    {
      label: "Verify Email",
      code: [
        "package main",
        "",
        'import (',
        '  "fmt"',
        '  blockmail "blockmail/sdk/go"',
        ")",
        "",
        "func main() {",
        '  client := blockmail.New("https://api.blockmail.dev", "your_api_key")',
        "",
        '  result, _ := client.Verify("user@example.com", nil)',
        "",
        "  if result.IsDisposable {",
        '    fmt.Printf("Blocked: %s\\n", result.Email)',
        "  }",
        "}",
      ].join("\n"),
    },
  ],
  php: [
    {
      label: "Verify Email",
      code: [
        "<?php",
        "",
        "use Blockmail\\Blockmail;",
        "",
        "$client = new Blockmail('your_api_key');",
        "",
        "$result = $client->verify('user@example.com');",
        "",
        "if ($result->is_disposable) {",
        "    echo 'Blocked disposable email';",
        "}",
      ].join("\n"),
    },
  ],
};

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState("curl");
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50/50">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight text-gray-900">
            Blockmail
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/try"
              className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
            >
              Try It
            </Link>
            <Link
              href="/sign-in"
              className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-[240px_1fr]">
            {/* Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-12 space-y-6">
                <div>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                    Getting Started
                  </h3>
                  <ul className="space-y-1">
                    <li>
                      <a href="#introduction" className="text-sm text-gray-600 hover:text-gray-900">
                        Introduction
                      </a>
                    </li>
                    <li>
                      <a href="#authentication" className="text-sm text-gray-600 hover:text-gray-900">
                        Authentication
                      </a>
                    </li>
                    <li>
                      <a href="#base-url" className="text-sm text-gray-600 hover:text-gray-900">
                        Base URL
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                    Endpoints
                  </h3>
                  <ul className="space-y-1">
                    {endpoints.map((ep) => (
                      <li key={ep.path}>
                        <a
                          href={`#${ep.path.replace(/\//g, "-")}`}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                        >
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${methodColors[ep.method]}`}>
                            {ep.method}
                          </span>
                          {ep.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                    SDKs
                  </h3>
                  <ul className="space-y-1">
                    {Object.keys(codeExamples).map((lang) => (
                      <li key={lang}>
                        <a href="#sdks" className="text-sm text-gray-600 hover:text-gray-900 capitalize">
                          {lang === "node" ? "Node.js" : lang}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </aside>

            {/* Content */}
            <div className="min-w-0 space-y-16">
              {/* Introduction */}
              <section id="introduction">
                <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                  API Documentation
                </h1>
                <p className="mt-3 text-gray-500">
                  Verify email addresses and detect disposable providers with our 6-tier verification engine.
                </p>
              </section>

              {/* Authentication */}
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

              {/* Base URL */}
              <section id="base-url">
                <h2 className="text-xl font-semibold text-gray-900">Base URL</h2>
                <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4">
                  <pre className="overflow-x-auto text-sm text-gray-700">
                    <code>https://api.blockmail.dev</code>
                  </pre>
                </div>
              </section>

              {/* Endpoints */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900">Endpoints</h2>
                <div className="mt-6 space-y-4">
                  {endpoints.map((ep) => {
                    const id = ep.path.replace(/\//g, "-");
                    const isExpanded = expandedEndpoint === ep.path;
                    return (
                      <div
                        key={ep.path}
                        id={id}
                        className="scroll-mt-20 rounded-xl border border-gray-100 bg-white"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedEndpoint(isExpanded ? null : ep.path)}
                          className="flex w-full items-center gap-3 p-4 text-left"
                        >
                          <span className={`shrink-0 rounded px-2 py-1 text-xs font-bold ${methodColors[ep.method]}`}>
                            {ep.method}
                          </span>
                          <span className="font-medium text-gray-900">{ep.path}</span>
                          <span className="ml-auto text-xs text-gray-400">{ep.title}</span>
                        </button>
                        {isExpanded && (
                          <div className="border-t border-gray-50 px-4 pb-4">
                            <p className="mt-3 text-sm text-gray-500">{ep.description}</p>
                            {ep.auth && (
                              <p className="mt-2 text-xs text-gray-400">
                                Requires authentication via <code className="rounded bg-gray-100 px-1 py-0.5">X-API-Key</code> header.
                              </p>
                            )}
                            {ep.requestExample && (
                              <div className="mt-4">
                                <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                                  Request Body
                                </h4>
                                <pre className="overflow-x-auto rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                                  <code>{ep.requestExample}</code>
                                </pre>
                              </div>
                            )}
                            <div className="mt-4">
                              <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                                Response
                              </h4>
                              <pre className="overflow-x-auto rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                                <code>{ep.responseExample}</code>
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* SDKs */}
              <section id="sdks">
                <h2 className="text-xl font-semibold text-gray-900">Code Examples</h2>
                <p className="mt-2 text-sm text-gray-500">
                  Copy-paste ready examples in your preferred language.
                </p>
                <div className="mt-6">
                  <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
                    {Object.keys(codeExamples).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setActiveTab(lang)}
                        className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                          activeTab === lang
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {lang === "node" ? "Node.js" : lang}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4">
                    <pre className="overflow-x-auto text-sm text-gray-700">
                      <code>{codeExamples[activeTab]?.[0]?.code}</code>
                    </pre>
                  </div>
                </div>
              </section>

              {/* Rate Limits */}
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
                      <tr>
                        <td className="px-4 py-2.5 text-gray-900">Free</td>
                        <td className="px-4 py-2.5 text-gray-600">10</td>
                        <td className="px-4 py-2.5 text-gray-600">100</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-gray-900">Pro</td>
                        <td className="px-4 py-2.5 text-gray-600">100</td>
                        <td className="px-4 py-2.5 text-gray-600">10,000</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-gray-900">Enterprise</td>
                        <td className="px-4 py-2.5 text-gray-600">1,000</td>
                        <td className="px-4 py-2.5 text-gray-600">Unlimited</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Error Codes */}
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
                      <tr>
                        <td className="px-4 py-2.5 font-mono text-xs text-gray-900">VALIDATION_ERROR</td>
                        <td className="px-4 py-2.5 text-gray-600">400</td>
                        <td className="px-4 py-2.5 text-gray-600">Invalid request body</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-mono text-xs text-gray-900">UNAUTHORIZED</td>
                        <td className="px-4 py-2.5 text-gray-600">401</td>
                        <td className="px-4 py-2.5 text-gray-600">Invalid or missing API key</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-mono text-xs text-gray-900">RATE_LIMITED</td>
                        <td className="px-4 py-2.5 text-gray-600">429</td>
                        <td className="px-4 py-2.5 text-gray-600">Too many requests</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-mono text-xs text-gray-900">ENGINE_UNAVAILABLE</td>
                        <td className="px-4 py-2.5 text-gray-600">503</td>
                        <td className="px-4 py-2.5 text-gray-600">Verification engine is down</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
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
