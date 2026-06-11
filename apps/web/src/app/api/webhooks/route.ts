import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createWebhookSchema } from "@/lib/validator";
import { getWebhooks, createWebhook, deleteWebhook } from "@/lib/services/webhook";
import { getUserByClerkId } from "@/lib/services/user";

// GET /api/webhooks - List all webhooks
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const user = await getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "USER_NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    const webhooks = await getWebhooks(user.id);

    return NextResponse.json({ success: true, data: webhooks });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}

// POST /api/webhooks - Create a new webhook
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const user = await getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "USER_NOT_FOUND", message: "User not found" } },
        { status: 404 }
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

    const newWebhook = await createWebhook({
      userId: user.id,
      url,
      events,
    });

    return NextResponse.json(
      {
        success: true,
        data: { ...newWebhook, message: "Store the webhook secret securely. It will not be shown again." },
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

// DELETE /api/webhooks - Delete a webhook
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const user = await getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "USER_NOT_FOUND", message: "User not found" } },
        { status: 404 }
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
