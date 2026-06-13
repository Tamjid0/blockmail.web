export type HttpMethod = "GET" | "POST" | "DELETE" | "PATCH";

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
  PATCH: "bg-amber-100 text-amber-700",
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
    method: "GET",
    path: "/api/health",
    title: "Health Check",
    description:
      "Check if the service is healthy. Returns connectivity status for database and engine.",
    auth: false,
    requestExample: "",
    responseExample: `{
  "status": "healthy",
  "timestamp": "2026-06-10T12:00:00Z",
  "services": {
    "database": {
      "status": "connected",
      "latencyMs": 12
    },
    "engine": {
      "status": "connected",
      "latencyMs": 45
    }
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
        "const response = await fetch('https://api.blockmail.dev/api/v1/verify', {",
        "  method: 'POST',",
        "  headers: {",
        "    'Content-Type': 'application/json',",
        "    'X-API-Key': 'your_api_key',",
        "  },",
        "  body: JSON.stringify({ email: 'user@example.com' }),",
        "});",
        "",
        "const data = await response.json();",
        "",
        "if (data.data.is_disposable) {",
        "  console.log('Blocked:', data.data.analysis.reason);",
        "}",
      ].join("\n"),
    },
  ],
  python: [
    {
      label: "Verify Email",
      code: [
        "import requests",
        "",
        "response = requests.post(",
        "    'https://api.blockmail.dev/api/v1/verify',",
        "    headers={",
        "        'Content-Type': 'application/json',",
        "        'X-API-Key': 'your_api_key',",
        "    },",
        "    json={'email': 'user@example.com'},",
        ")",
        "",
        "data = response.json()",
        "if data['data']['is_disposable']:",
        "    print(f\"Blocked: {data['data']['analysis']['reason']}\")",
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
        '  "bytes"',
        '  "encoding/json"',
        '  "fmt"',
        '  "net/http"',
        ")",
        "",
        "func main() {",
        '  body, _ := json.Marshal(map[string]string{',
        '    "email": "user@example.com",',
        "  })",
        "",
        '  req, _ := http.NewRequest("POST", "https://api.blockmail.dev/api/v1/verify", bytes.NewBuffer(body))',
        '  req.Header.Set("Content-Type", "application/json")',
        '  req.Header.Set("X-API-Key", "your_api_key")',
        "",
        "  resp, _ := http.DefaultClient.Do(req)",
        "  defer resp.Body.Close()",
        "",
        "  var result map[string]interface{}",
        "  json.NewDecoder(resp.Body).Decode(&result)",
        "",
        '  data := result["data"].(map[string]interface{})',
        '  if data["is_disposable"].(bool) {',
        '    fmt.Printf("Blocked: %s\\n", data["analysis"].(map[string]interface{})["reason"])',
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
        "$ch = curl_init('https://api.blockmail.dev/api/v1/verify');",
        "curl_setopt($ch, CURLOPT_POST, true);",
        "curl_setopt($ch, CURLOPT_HTTPHEADER, [",
        "    'Content-Type: application/json',",
        "    'X-API-Key: your_api_key',",
        "]);",
        "curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['email' => 'user@example.com']));",
        "curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);",
        "",
        "$response = json_decode(curl_exec($ch), true);",
        "curl_close($ch);",
        "",
        "if ($response['data']['is_disposable']) {",
        "    echo 'Blocked: ' . $response['data']['analysis']['reason'];",
        "}",
      ].join("\n"),
    },
  ],
};

export const rateLimitData = [
  { plan: "Free", perMinute: "10", perDay: "100" },
  { plan: "Pro", perMinute: "100", perDay: "10,000" },
  { plan: "Enterprise", perMinute: "1,000", perDay: "100,000" },
];

export const errorCodes = [
  { code: "VALIDATION_ERROR", status: "400", description: "Invalid request body" },
  { code: "MISSING_API_KEY", status: "401", description: "No API key provided" },
  { code: "INVALID_API_KEY", status: "401", description: "API key is invalid or revoked" },
  { code: "RATE_LIMIT_EXCEEDED", status: "429", description: "Per-minute rate limit exceeded" },
  { code: "DAILY_LIMIT_EXCEEDED", status: "429", description: "Daily rate limit exceeded" },
  { code: "ENGINE_UNAVAILABLE", status: "503", description: "Verification engine is unavailable" },
];
