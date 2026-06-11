import { NextResponse } from "next/server";
import { createUser } from "@/lib/services/user";

export async function POST(req: Request) {
  try {
    const { supabaseId, email, name } = await req.json();

    if (!supabaseId || !email) {
      return NextResponse.json(
        { error: "supabaseId and email are required" },
        { status: 400 }
      );
    }

    const user = await createUser({ supabaseId, email, name });
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Auth sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
