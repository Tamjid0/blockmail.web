import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function DELETE() {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const userId = auth.dbUser.id;

    // Delete all user data (cascade handles most, but be explicit)
    await prisma.$transaction([
      prisma.usageLog.deleteMany({ where: { userId } }),
      prisma.webhook.deleteMany({ where: { userId } }),
      prisma.apiKey.deleteMany({ where: { userId } }),
      prisma.auditLog.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    // Sign out from Supabase
    const supabase = await createClient();
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { success: false, error: { code: "DELETE_FAILED", message: "Failed to delete account." } },
      { status: 500 }
    );
  }
}
