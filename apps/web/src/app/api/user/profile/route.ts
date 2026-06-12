import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updateUser } from "@/lib/services/user";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().max(100).optional(),
});

export async function PATCH(request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.errors[0].message } },
        { status: 400 }
      );
    }

    await updateUser(auth.dbUser.supabaseId, parsed.data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { success: false, error: { code: "UPDATE_FAILED", message: "Failed to update profile." } },
      { status: 500 }
    );
  }
}
