import { NextResponse } from "next/server";
import { createUser } from "@/lib/services/user";
import { createClient } from "@supabase/supabase-js";
import { checkIpRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/ip";
import { z } from "zod";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ENGINE_URL = process.env.BLOCKMAIL_ENGINE_URL || "http://localhost:8080";
const ENGINE_API_KEY = process.env.BLOCKMAIL_ENGINE_API_KEY || "development-secret-key";

const signupSyncSchema = z.object({
  supabaseId: z.string().min(1),
  email: z.string().email(),
  name: z.string().max(100).optional(),
});

export async function POST(req: Request) {
  try {
    // 1. Rate limit: 5 signups per IP per hour (prevent bot mass signups)
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const ip = getClientIp({
      headers: {
        get: (name: string) =>
          name.toLowerCase() === "x-forwarded-for"
            ? forwarded
            : name.toLowerCase() === "x-real-ip"
              ? realIp
              : null,
      },
    } as any);

    const signupRateCheck = await checkIpRateLimit(`signup:${ip}`, 5, 3600);
    if (!signupRateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again later." },
        { status: 429 }
      );
    }

    // 2. Parse and validate input
    const body = await req.json();
    const parsed = signupSyncSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { supabaseId, email, name } = parsed.data;

    // 3. Verify the supabaseId exists in Supabase (prevents arbitrary user creation)
    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.getUserById(supabaseId);
    if (authError || !authUser.user) {
      return NextResponse.json(
        { error: "Invalid supabaseId" },
        { status: 401 }
      );
    }

    // 4. Use email from Supabase (not client-provided)
    const verifiedEmail = authUser.user.email!;

    // 5. Block disposable emails at signup via Go engine
    try {
      const engineResponse = await fetch(`${ENGINE_URL}/v1/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": ENGINE_API_KEY,
        },
        body: JSON.stringify({ email: verifiedEmail }),
        signal: AbortSignal.timeout(10000),
      });

      if (engineResponse.ok) {
        const engineData = await engineResponse.json();
        if (engineData.is_disposable) {
          return NextResponse.json(
            { error: "Disposable email addresses are not allowed. Please use a permanent email." },
            { status: 400 }
          );
        }
      }
      // If engine is down, allow signup (fail open for availability)
    } catch {
      // Engine unavailable — skip check, allow signup
    }

    // 6. Create user in our database
    const user = await createUser({
      supabaseId,
      email: verifiedEmail,
      name: name || authUser.user.user_metadata?.full_name || null,
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Auth sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
