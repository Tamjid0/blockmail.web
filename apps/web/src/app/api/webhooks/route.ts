import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createWebhookSchema } from "@/lib/validator";
import { getWebhooks, createWebhook, deleteWebhook, toggleWebhook } from "@/lib/services/webhook";
import { validateWebhookUrl } from "@/lib/ssrf";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const webhooks = await getWebhooks(auth.dbUser.id);
    return NextResponse.json({ success: true, data: webhooks });
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
    const result = createWebhookSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: result.error.issues[0].message } },
        { status: 400 }
      );
    }

    const { url, events } = result.data;

    // SSRF protection — validate URL doesn't point to internal networks
    const ssrfError = await validateWebhookUrl(url);
    if (ssrfError) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_URL", message: ssrfError } },
        { status: 400 }
      );
    }

    const newWebhook = await createWebhook({
      userId: auth.dbUser.id,
      url,
      events,
    });

    return NextResponse.json(
      { success: true, data: { ...newWebhook, message: "Store the webhook secret securely. It will not be shown again." } },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, isActive } = body as { id: string; isActive: boolean };

    if (!id || typeof isActive !== "boolean") {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "id and isActive are required" } },
        { status: 400 }
      );
    }

    await toggleWebhook(id, isActive);
    return NextResponse.json({ success: true });
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
    const webhookId = searchParams.get("id");
    if (!webhookId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Webhook ID is required" } },
        { status: 400 }
      );
    }

    await deleteWebhook(webhookId);
    return NextResponse.json({ success: true, message: "Webhook deleted successfully" });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
