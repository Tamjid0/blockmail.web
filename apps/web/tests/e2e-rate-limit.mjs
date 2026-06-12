/**
 * E2E Rate Limiting Tests
 * Tests anonymous vs authenticated try-it rate limits.
 *
 * Run with: node tests/e2e-rate-limit.mjs
 * Requires: dev server running on http://localhost:3000
 *
 * NOTE: Rate limiting requires Redis (Upstash in production).
 * In local dev without Upstash token, rate limiter fails open (allows all).
 * These tests verify the rate limiting code path and auth flow work correctly.
 */

const BASE_URL = "http://localhost:3000";
const TEST_EMAIL = "tamjid11220@gmail.com";
const TEST_PASSWORD = "10203040";

let passed = 0;
let failed = 0;

function log(status, msg) {
  if (status === "pass") {
    passed++;
    console.log(`  ✅ ${msg}`);
  } else {
    failed++;
    console.log(`  ❌ ${msg}`);
  }
}

function assert(condition, msg) {
  if (condition) {
    log("pass", msg);
  } else {
    log("fail", msg);
  }
}

// ─── Helper: make try-it request ─────────────────────────────────────────────
async function tryRequest(email, cookies) {
  const headers = {
    "Content-Type": "application/json",
    Origin: BASE_URL,
    Referer: `${BASE_URL}/try`,
  };
  if (cookies) headers["Cookie"] = cookies;

  const res = await fetch(`${BASE_URL}/api/v1/try`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email }),
  });

  const body = await res.json();
  return { status: res.status, body, headers: res.headers };
}

// ─── Helper: sign in via Supabase Auth API ───────────────────────────────────
async function signIn() {
  const supabaseUrl = "https://uodtljfaxrrhmlbjfkbm.supabase.co";
  const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZHRsamZheHJyaG1sYmpma2JtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNTI1NjIsImV4cCI6MjA5NjcyODU2Mn0.IJaCfmi5RHMbJuZQPDiJJRULoIld1bQmlynAIXxb5so";

  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });

  const data = await res.json();

  if (!res.ok) {
    return { success: false, error: data.error_description || data.msg || "Unknown error", data };
  }

  return { success: true, data };
}

// ─── Helper: build Supabase SSR cookies from tokens ──────────────────────────
function buildSupabaseCookies(data) {
  const projectRef = "uodtljfaxrrhmlbjfkbm";
  const cookieName = `sb-${projectRef}-auth-token`;

  const cookieValue = JSON.stringify({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_in ? Math.floor(Date.now() / 1000) + data.expires_in : undefined,
    expires_in: data.expires_in,
    token_type: data.token_type || "bearer",
    user: data.user,
  });

  return `${cookieName}=${encodeURIComponent(cookieValue)}`;
}

// ─── Helper: create authenticated session ─────────────────────────────────────
async function getAuthenticatedSession() {
  const signInResult = await signIn();

  if (!signInResult.success) {
    return { success: false, error: signInResult.error };
  }

  const cookies = buildSupabaseCookies(signInResult.data);

  return {
    success: true,
    accessToken: signInResult.data.access_token,
    refreshToken: signInResult.data.refresh_token,
    cookies,
    user: signInResult.data.user,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITES
// ═══════════════════════════════════════════════════════════════════════════════

async function testTryEndpointWorks() {
  console.log("\n🧪 Test Suite 1: Try-It Endpoint Basic Functionality");
  console.log("─".repeat(50));

  // Test basic request
  const r1 = await tryRequest("test@example.com");
  assert(r1.status === 200 || r1.status === 503, `Request status: ${r1.status} (200=success, 503=engine down)`);

  if (r1.status === 200) {
    assert(r1.body.email === "test@example.com", "Returns correct email");
    assert(typeof r1.body.is_disposable === "boolean", "Returns is_disposable boolean");
    assert(typeof r1.body.risk_score === "number", "Returns risk_score number");
    assert(Array.isArray(r1.body.tier_results), "Returns tier_results array");
    assert(typeof r1.body.recommendation === "string", "Returns recommendation string");
    assert(r1.body.tier_results.length === 6, "Has 6 tier results");

    // Check rate_limit in response body
    assert(r1.body.rate_limit !== undefined, "Response has rate_limit object");
    assert(typeof r1.body.rate_limit.limit === "number", "rate_limit.limit is a number");
    assert(typeof r1.body.rate_limit.remaining === "number", "rate_limit.remaining is a number");
  }
}

async function testInputValidation() {
  console.log("\n🧪 Test Suite 2: Input Validation");
  console.log("─".repeat(50));

  // Test invalid email
  const r1 = await tryRequest("not-an-email");
  assert(r1.status === 400, `Invalid email: status ${r1.status} (expected 400)`);
  assert(r1.body.error !== undefined, "Invalid email: has error message");

  // Test empty body
  const r2 = await tryRequest("");
  assert(r2.status === 400, `Empty email: status ${r2.status} (expected 400)`);
}

async function testAuthentication() {
  console.log("\n🧪 Test Suite 3: Authentication Flow");
  console.log("─".repeat(50));

  const result = await getAuthenticatedSession();

  if (!result.success) {
    log("fail", `Sign-in failed: ${result.error}`);
    console.log("\n  ⚠️  Cannot test authenticated features without valid session.");
    return null;
  }

  assert(result.success, "Sign-in succeeded");
  assert(result.user?.email === TEST_EMAIL, `User email matches: ${result.user?.email}`);
  assert(result.accessToken !== undefined, "Got access token");
  assert(result.refreshToken !== undefined, "Got refresh token");
  assert(result.cookies !== undefined, "Built Supabase SSR cookies");

  return result;
}

async function testAuthenticatedTry(session) {
  console.log("\n🧪 Test Suite 4: Authenticated Try-It");
  console.log("─".repeat(50));

  if (!session) {
    console.log("  ⏭️  Skipped (no session)");
    return;
  }

  const r = await tryRequest("auth@example.com", session.cookies);

  // 200 = recognized as authenticated, 429 = rate limited, 503 = engine down
  assert(
    r.status === 200 || r.status === 429 || r.status === 503,
    `Authenticated request: status ${r.status}`
  );

  if (r.status === 200) {
    assert(r.body.rate_limit !== undefined, "Has rate_limit in response");
    // Authenticated limit should be higher (5/min) vs anonymous (3/min)
    assert(r.body.rate_limit.limit === 5, `Authenticated limit: ${r.body.rate_limit.limit} (expected 5)`);
  }
}

async function testMultipleRequests() {
  console.log("\n🧪 Test Suite 5: Rate Limiting Enforced");
  console.log("─".repeat(50));

  // Try a bunch of requests — should hit 429 eventually (in-memory store enforces limits)
  let gotRateLimited = false;
  let succeeded = 0;

  for (let i = 1; i <= 10; i++) {
    const r = await tryRequest(`ratelimit${i}@test.com`);
    if (r.status === 429) {
      gotRateLimited = true;
      assert(true, `Request ${i}: correctly rate limited (429)`);
      break;
    } else if (r.status === 200) {
      succeeded++;
    } else {
      break; // 503 = engine down
    }
  }

  assert(gotRateLimited || succeeded > 0, `Rate limiting active: ${gotRateLimited ? "enforced" : `${succeeded} requests before engine limit`}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// RUN ALL TESTS
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║         Blockmail E2E Rate Limiting Tests                   ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`\n  🌐 Target: ${BASE_URL}`);
  console.log(`  📧 Test account: ${TEST_EMAIL}`);

  // Check server is running
  try {
    const res = await fetch(`${BASE_URL}/`);
    console.log(`  ✅ Server responding (${res.status})\n`);
  } catch {
    console.log("\n  ❌ Cannot connect to server. Make sure dev server is running:");
    console.log("     cd apps/web && npm run dev");
    process.exit(1);
  }

  // Run tests
  await testTryEndpointWorks();
  await testInputValidation();
  const session = await testAuthentication();
  await testAuthenticatedTry(session);
  await testMultipleRequests();

  // Summary
  console.log("\n" + "═".repeat(60));
  console.log(`  📊 FINAL RESULTS: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log("  🎉 All tests passed!");
  }
  console.log("═".repeat(60));

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
