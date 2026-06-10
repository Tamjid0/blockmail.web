import { NextResponse } from "next/server";
import { z } from "zod";

const ENGINE_URL = process.env.BLOCKMAIL_ENGINE_URL || "http://localhost:8080";
const ENGINE_API_KEY = process.env.BLOCKMAIL_ENGINE_API_KEY || "development-secret-key";

const trySchema = z.object({
  email: z.string().email("Invalid email format"),
});

const TIER_NAMES = [
  "Format Analysis",
  "Domain Intelligence",
  "Network Fingerprint",
  "Reputation Scoring",
  "Infrastructure Analysis",
  "Pattern Detection",
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = trySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    try {
      const engineResponse = await fetch(`${ENGINE_URL}/v1/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": ENGINE_API_KEY,
        },
        body: JSON.stringify({ email }),
        signal: AbortSignal.timeout(10000),
      });

      if (!engineResponse.ok) {
        throw new Error(`Engine returned ${engineResponse.status}`);
      }

      const engineData = await engineResponse.json();

      const tierResults = TIER_NAMES.map((name, i) => ({
        tier: i + 1,
        name,
        passed: engineData.analysis?.tier_triggered
          ? i + 1 !== engineData.analysis.tier_triggered
          : true,
        details:
          engineData.analysis?.tier_triggered === i + 1
            ? `Blocked at this tier: ${engineData.analysis?.reason || "failed"}`
            : engineData.analysis?.tier_triggered !== undefined && i + 1 <= engineData.analysis.tier_triggered
              ? `Checked: ${name}`
              : "Not reached",
      }));

      const isDisposable = engineData.is_disposable ?? false;
      const riskScore = engineData.risk_score ?? 0;

      let recommendation: string;
      if (isDisposable) {
        recommendation = "This is a disposable email address. We recommend blocking it to maintain a clean user database.";
      } else if (riskScore >= 50) {
        recommendation = "This email has moderate risk. Consider additional verification steps.";
      } else {
        recommendation = "This appears to be a legitimate email address. Safe to accept.";
      }

      return NextResponse.json({
        email,
        is_disposable: isDisposable,
        is_valid: true,
        risk_score: riskScore,
        tier_results: tierResults,
        recommendation,
      });
    } catch {
      return NextResponse.json(
        { error: "Verification engine is not available. Please try again later." },
        { status: 503 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
