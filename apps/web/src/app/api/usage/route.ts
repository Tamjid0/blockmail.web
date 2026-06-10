import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { usageQuerySchema } from "@/lib/validator";

// GET /api/usage - Get usage statistics
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = {
      period: searchParams.get("period") || "30d",
      key_id: searchParams.get("key_id") || undefined,
    };

    // Validate query
    const result = usageQuerySchema.safeParse(query);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: result.error.issues[0].message,
          },
        },
        { status: 400 }
      );
    }

    // TODO: Fetch from database
    const usage = {
      summary: {
        total_requests: 15420,
        blocked: 3200,
        allowed: 12220,
        block_rate: 0.207,
      },
      daily: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        requests: Math.floor(Math.random() * 1000) + 200,
        blocked: Math.floor(Math.random() * 200) + 50,
        allowed: Math.floor(Math.random() * 800) + 150,
      })),
      by_key: [
        {
          key_id: "key_1",
          key_name: "Production",
          requests: 12000,
          blocked: 2500,
        },
      ],
      by_reason: [
        { reason: "domain_blocklist_hit", count: 2100 },
        { reason: "infra_fingerprint_hit", count: 800 },
        { reason: "behavioral_context_hit", count: 300 },
      ],
    };

    return NextResponse.json({
      success: true,
      data: usage,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}
