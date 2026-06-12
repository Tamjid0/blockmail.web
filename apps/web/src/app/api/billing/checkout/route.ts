import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createCheckoutSession } from "@/lib/services/billing";

export async function POST() {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    if (auth.dbUser.plan === "PRO" || auth.dbUser.plan === "ENTERPRISE") {
      return NextResponse.json(
        { success: false, error: { code: "ALREADY_SUBSCRIBED", message: "You are already on a paid plan." } },
        { status: 400 }
      );
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const session = await createCheckoutSession(
      auth.dbUser.id,
      auth.dbUser.email,
      origin
    );

    return NextResponse.json({ success: true, data: { url: session.url } });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { success: false, error: { code: "CHECKOUT_FAILED", message: "Failed to create checkout session." } },
      { status: 500 }
    );
  }
}
