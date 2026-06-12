import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const publicRoutes = [
  "/",
  "/sign-in",
  "/sign-up",
  "/sign-out",
  "/try",
  "/docs",
  "/api/health",
  "/api/v1/try",
  "/api/v1/verify",
  "/api/auth/sync",
  "/api/webhooks/stripe",
];

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and internal Next.js routes
  if (
    pathname.startsWith("/_next") ||
    (pathname.includes(".") && !pathname.startsWith("/api"))
  ) {
    return NextResponse.next();
  }

  // CSRF protection for state-changing requests
  if (
    request.method === "POST" ||
    request.method === "PUT" ||
    request.method === "PATCH" ||
    request.method === "DELETE"
  ) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== host) {
          return NextResponse.json(
            { error: "CSRF validation failed" },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: "CSRF validation failed" },
          { status: 403 }
        );
      }
    }
  }

  // Rate limiting for API routes
  if (
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/health") &&
    !pathname.startsWith("/api/v1/try") &&
    !pathname.startsWith("/api/webhooks")
  ) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const key = `${ip}:${pathname}`;
    const now = Date.now();

    // Simple in-memory rate limit (60 req/min for reads, 10 for writes)
    const isWrite = ["POST", "PUT", "PATCH", "DELETE"].includes(
      request.method
    );
    const limit = isWrite ? 10 : 60;
    const windowMs = 60 * 1000;

    // Using globalThis to persist across requests in dev
    const store = (globalThis as Record<string, unknown>).__rateLimitStore as
      | Map<string, { count: number; resetAt: number }>
      | undefined;
    const rateLimitStore =
      store || ((globalThis as Record<string, unknown>).__rateLimitStore = new Map<string, { count: number; resetAt: number }>());

    const entry = rateLimitStore.get(key);
    if (entry && now <= entry.resetAt) {
      if (entry.count >= limit) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          {
            status: 429,
            headers: {
              "Retry-After": "60",
              "X-RateLimit-Limit": String(limit),
              "X-RateLimit-Remaining": "0",
            },
          }
        );
      }
      entry.count++;
    } else {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    }
  }

  // Public routes — no auth required
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Protected routes — check Supabase session
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
