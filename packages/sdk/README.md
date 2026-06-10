# Blockmail SDK

Official TypeScript/JavaScript SDK for the Blockmail disposable email verification API.

## Installation

```bash
npm install @blockmail/sdk
# or
yarn add @blockmail/sdk
# or
pnpm add @blockmail/sdk
```

## Quick Start

```typescript
import { Blockmail } from "@blockmail/sdk";

const blockmail = new Blockmail("your_api_key");

// Verify an email
const result = await blockmail.verify("user@example.com");

if (result.is_disposable) {
  console.log("Blocked disposable email");
}
```

## Configuration

```typescript
const blockmail = new Blockmail({
  apiKey: "your_api_key",
  baseUrl: "https://api.blockmail.dev", // optional
  timeout: 10000, // optional, ms
});
```

## Methods

### `verify(email: string): Promise<VerificationResult>`

Verify an email address and get full analysis.

```typescript
const result = await blockmail.verify("user@example.com");

console.log(result.is_disposable); // true | false
console.log(result.risk_score);    // 0-100
console.log(result.analysis);      // Detailed analysis
```

### `isDisposable(email: string): Promise<boolean>`

Quick check if an email is disposable.

```typescript
if (await blockmail.isDisposable("user@example.com")) {
  // Block the signup
}
```

### `isSafe(email: string): Promise<boolean>`

Quick check if an email is safe (not disposable).

```typescript
if (await blockmail.isSafe("user@example.com")) {
  // Allow the signup
}
```

### `healthCheck(): Promise<HealthStatus>`

Check if the API is healthy.

```typescript
const health = await blockmail.healthCheck();
console.log(health.status); // "healthy"
```

## Error Handling

```typescript
import { Blockmail, BlockmailException } from "@blockmail/sdk";

try {
  await blockmail.verify("user@example.com");
} catch (error) {
  if (error instanceof BlockmailException) {
    console.log(error.code);    // "UNAUTHORIZED", "RATE_LIMITED", etc.
    console.log(error.message); // Human-readable error message
    console.log(error.status);  // HTTP status code
  }
}
```

## TypeScript

The SDK is fully typed. All request parameters and response objects have complete type definitions.

```typescript
import type { VerificationResult, BlockmailConfig } from "@blockmail/sdk";
```

## License

MIT
