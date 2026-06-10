import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createApiKeySchema } from "@/lib/validator";

// GET /api/keys - List all API keys
export async function GET() {
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

    // TODO: Fetch from database
    const keys = [
      {
        id: "key_1",
        name: "Production",
        prefix: "bm_live_a1b2",
        permissions: ["verify"],
        rate_limit: 1000,
        daily_limit: 10000,
        is_active: true,
        last_used_at: "2026-06-10T12:00:00Z",
        created_at: "2026-06-01T00:00:00Z",
      },
    ];

    return NextResponse.json({
      success: true,
      data: keys,
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

// POST /api/keys - Create a new API key
export async function POST(request: NextRequest) {
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

    const body = await request.json();

    // Validate input
    const result = createApiKeySchema.safeParse(body);
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

    const { name, permissions, rate_limit, daily_limit } = result.data;

    // TODO: Create in Unkey and database
    const newKey = {
      id: `key_${Date.now()}`,
      name,
      prefix: `bm_live_${Math.random().toString(36).substring(2, 6)}`,
      key: `bm_live_${Math.random().toString(36).substring(2, 18)}`,
      permissions: permissions || ["verify"],
      rate_limit: rate_limit || 100,
      daily_limit: daily_limit || 100,
      is_active: true,
      last_used_at: null,
      created_at: new Date().toISOString(),
      message: "Store this key securely. It will not be shown again.",
    };

    return NextResponse.json(
      {
        success: true,
        data: newKey,
      },
      { status: 201 }
    );
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
