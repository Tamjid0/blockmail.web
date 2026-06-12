import { NextResponse } from "next/server";
import { createUser } from "@/lib/services/user";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { supabaseId, email, name } = await req.json();

    if (!supabaseId || !email) {
      return NextResponse.json(
        { error: "supabaseId and email are required" },
        { status: 400 }
      );
    }

    // Verify the supabaseId exists in Supabase (prevents arbitrary user creation)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(supabaseId);
    if (authError || !authUser.user) {
      return NextResponse.json(
        { error: "Invalid supabaseId" },
        { status: 401 }
      );
    }

    // Use email from Supabase (not client-provided)
    const user = await createUser({
      supabaseId,
      email: authUser.user.email!,
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
