import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { usageQuerySchema } from "@/lib/validator";
import { getUsageStats, getRequestLog } from "@/lib/services/usage";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view");

    if (view === "log") {
      const page = Number(searchParams.get("page") || "1");
      const limit = Number(searchParams.get("limit") || "20");
      const keyFilter = searchParams.get("key_id") || undefined;
      const statusFilter = (searchParams.get("status") as "blocked" | "allowed" | null) || undefined;

      const log = await getRequestLog(auth.dbUser.id, {
        page,
        limit,
        keyFilter,
        statusFilter: statusFilter ?? undefined,
      });
      return NextResponse.json({ success: true, data: log });
    }

    const query = {
      period: searchParams.get("period") || "30d",
      key_id: searchParams.get("key_id") || undefined,
    };

    const result = usageQuerySchema.safeParse(query);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: result.error.issues[0].message } },
        { status: 400 }
      );
    }

    const usage = await getUsageStats(auth.dbUser.id, result.data.period ?? "30d", result.data.key_id);
    return NextResponse.json({ success: true, data: usage });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
