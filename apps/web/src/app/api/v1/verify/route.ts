import { NextRequest, NextResponse } from "next/server";
import { verifyEmailSchema } from "@/lib/validator";

const ENGINE_URL = process.env.BLOCKMAIL_ENGINE_URL || "http://localhost:8080";
const ENGINE_API_KEY = process.env.BLOCKMAIL_ENGINE_API_KEY || "development-secret-key";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = verifyEmailSchema.safeParse(body);
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

    const { email, context } = result.data;

    try {
      const engineResponse = await fetch(`${ENGINE_URL}/v1/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": ENGINE_API_KEY,
        },
        body: JSON.stringify({ email, context }),
        signal: AbortSignal.timeout(10000),
      });

      if (!engineResponse.ok) {
        throw new Error(`Engine returned ${engineResponse.status}`);
      }

      const engineData = await engineResponse.json();

      return NextResponse.json({
        success: true,
        data: {
          email,
          is_disposable: engineData.is_disposable ?? false,
          risk_score: engineData.risk_score ?? 0,
          analysis: engineData.analysis ?? {},
        },
        meta: {
          request_id: engineData.request_id ?? `req_${Date.now()}`,
          latency_ms: engineData.latency_ms ?? 0,
        },
      });
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ENGINE_UNAVAILABLE",
            message: "Verification engine is not available. Please try again later.",
          },
        },
        { status: 503 }
      );
    }
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
