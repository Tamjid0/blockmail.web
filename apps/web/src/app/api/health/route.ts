import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ENGINE_URL = process.env.BLOCKMAIL_ENGINE_URL || "http://localhost:8080";

async function checkDatabase(): Promise<{ status: string; latencyMs: number }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "connected", latencyMs: Date.now() - start };
  } catch {
    return { status: "error", latencyMs: Date.now() - start };
  }
}

async function checkEngine(): Promise<{ status: string; latencyMs: number }> {
  const start = Date.now();
  try {
    const res = await fetch(`${ENGINE_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    return { status: res.ok ? "connected" : "error", latencyMs: Date.now() - start };
  } catch {
    return { status: "error", latencyMs: Date.now() - start };
  }
}

export async function GET() {
  const [database, engine] = await Promise.all([checkDatabase(), checkEngine()]);

  const healthy = database.status === "connected" && engine.status === "connected";

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      services: { database, engine },
    },
    { status: healthy ? 200 : 503 }
  );
}
