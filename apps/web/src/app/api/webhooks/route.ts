import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createWebhookSchema } from "@/lib/validator";

// GET /api/webhooks - List all webhooks
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
    const webhooks = [
      {
        id: "wh_1",
        url: "https://api.example.com/webhooks/blockmail",
        events: ["email.blocked"],
        is_active: true,
        last_triggered_at: "2026-06-10T12:00:00Z",
        created_at: "2026-06-01T00:00:00Z",
      },
    ];

    return NextResponse.json({
      success: true,
      data: webhooks,
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

// POST /api/webhooks - Create a new webhook
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
    const result = createWebhookSchema.safeParse(body);
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

    const { url, events } = result.data;

    // TODO: Create in database
    const newWebhook = {
      id: `wh_${Date.now()}`,
      url,
      events,
      secret: `whsec_${Math.random().toString(36).substring(2, 18)}`,
      is_active: true,
      last_triggered_at: null,
      created_at: new Date().toISOString(),
      message: "Store the webhook secret securely. It will not be shown again.",
    };

    return NextResponse.json(
      {
        success: true,
        data: newWebhook,
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

// DELETE /api/webhooks - Delete a webhook
export async function DELETE(request: NextRequest) {
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
    const webhookId = searchParams.get("id");

    if (!webhookId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Webhook ID is required",
          },
        },
        { status: 400 }
      );
    }

    // TODO: Delete from database

    return NextResponse.json({
      success: true,
      message: "Webhook deleted successfully",
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
