import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createPortalSession } from "@/lib/services/billing";

export async function POST() {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    if (!auth.dbUser.stripeCustomerId) {
      return NextResponse.json(
        { success: false, error: { code: "NO_SUBSCRIPTION", message: "No billing account found." } },
        { status: 400 }
      );
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010";
    const session = await createPortalSession(auth.dbUser.id, origin);

    return NextResponse.json({ success: true, data: { url: session.url } });
  } catch (error) {
    console.error("Portal error:", error);
    return NextResponse.json(
      { success: false, error: { code: "PORTAL_FAILED", message: "Failed to create portal session." } },
      { status: 500 }
    );
  }
}
