export type HttpMethod = "GET" | "POST" | "DELETE";

export interface Endpoint {
  method: HttpMethod;
  path: string;
  title: string;
  description: string;
  auth: boolean;
  requestExample: string;
  responseExample: string;
}

export const methodColors: Record<HttpMethod, string> = {
  GET: "bg-emerald-100 text-emerald-700",
  POST: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
};

export const endpoints: Endpoint[] = [
  {
    method: "POST",
    path: "/api/v1/verify",
    title: "Verify Email",
    description:
      "Check if an email address is disposable. Returns verification result with risk score and tier analysis.",
    auth: true,
    requestExample: `{
  "email": "user@example.com"
}`,
    responseExample: `{
  "success": true,
  "data": {
    "email": "user@example.com",
    "is_disposable": false,
    "risk_score": 0,
    "analysis": {
      "tier_triggered": 0,
      "reason": "allowed",
      "domain": "example.com"
    }
  },
  "meta": {
    "request_id": "req_abc123",
    "latency_ms": 12
  }
}`,
  },
  {
    method: "POST",
    path: "/api/v1/check",
    title: "Check Multiple Emails",
    description:
      "Verify multiple emails in a single request (max 100). Returns results for each email with a summary.",
    auth: true,
    requestExample: `{
  "emails": [
    "user1@example.com",
    "user2@mailinator.com"
  ]
}`,
    responseExample: `{
  "success": true,
  "data": {
    "results": [
      {
        "email": "user1@example.com",
        "is_disposable": false,
        "risk_score": 0
      },
      {
        "email": "user2@mailinator.com",
        "is_disposable": true,
        "risk_score": 95
      }
    ],
    "summary": {
      "total": 2,
      "disposable": 1,
      "clean": 1
    }
  },
  "meta": {
    "request_id": "req_def456",
    "latency_ms": 45
  }
}`,
  },
  {
    method: "GET",
    path: "/api/health",
    title: "Health Check",
    description:
      "Check if the service is healthy. Returns connectivity status for all services.",
    auth: false,
    requestExample: "",
    responseExample: `{
  "status": "healthy",
  "timestamp": "2026-06-10T12:00:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "engine": "connected"
  }
}`,
  },
];

export const codeExamples: Record<string, { label: string; code: string }[]> = {
  curl: [
    {
      label: "Verify Email",
      code: [
        "curl -X POST https://api.blockmail.dev/api/v1/verify \\",
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

export const rateLimitData = [
  { plan: "Free", perMinute: "10", perDay: "100" },
  { plan: "Pro", perMinute: "100", perDay: "1,000" },
  { plan: "Enterprise", perMinute: "Custom", perDay: "Custom" },
];

export const errorCodes = [
  { code: "VALIDATION_ERROR", status: "400", description: "Invalid request body" },
  { code: "UNAUTHORIZED", status: "401", description: "Invalid or missing API key" },
  { code: "RATE_LIMITED", status: "429", description: "Too many requests" },
  { code: "ENGINE_UNAVAILABLE", status: "503", description: "Verification engine is down" },
];
