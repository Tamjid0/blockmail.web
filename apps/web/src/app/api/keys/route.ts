import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createApiKey, getApiKeys, revokeApiKey } from "@/lib/services/key-management";

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
    const { name } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Name is required" } },
        { status: 400 }
      );
    }

    const result = await createApiKey(
      auth.dbUser.id,
      name,
      auth.dbUser.plan
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: "CREATE_FAILED", message: result.error ?? "Failed to create API key" } },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: result.consumerId,
          key: result.key,
          message: "Store this key securely. It will not be shown again.",
        },
      },
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

    const success = await revokeApiKey(auth.dbUser.id, keyId);
    if (!success) {
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
