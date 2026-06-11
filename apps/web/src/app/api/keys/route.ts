import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createApiKeySchema } from "@/lib/validator";
import { getApiKeys, createApiKey, revokeApiKey } from "@/lib/services/apikey";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const keys = await getApiKeys(auth.dbUser.id);
    return NextResponse.json({ success: true, data: keys });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = createApiKeySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: result.error.issues[0].message } },
        { status: 400 }
      );
    }

    const { name, permissions, rate_limit, daily_limit } = result.data;

    const newKey = await createApiKey({
      userId: auth.dbUser.id,
      name,
      permissions: permissions ?? ["verify"],
      rateLimit: rate_limit ?? 100,
      dailyLimit: daily_limit ?? 100,
    });

    return NextResponse.json(
      { success: true, data: { ...newKey, message: "Store this key securely. It will not be shown again." } },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get("id");
    if (!keyId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Key ID is required" } },
        { status: 400 }
      );
    }

    const existing = await revokeApiKey(keyId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "API key not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "API key revoked successfully" });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
