import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

/**
 * GET /api/health — Health check endpoint
 * Returns system status and connectivity info
 * No authentication required - useful for uptime monitoring
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Test database connectivity with a simple query
    const dbTest = await db.select({ id: user.id }).from(user).limit(1);
    const dbLatency = Date.now() - startTime;

    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        version: "0.1.0",
        uptime: process.uptime(),
        latency: {
          database: `${dbLatency}ms`,
        },
        checks: {
          database: "✓",
          api: "✓",
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Health Check Error]", error);
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        version: "0.1.0",
        uptime: process.uptime(),
        checks: {
          database: "✗",
          api: "✓",
        },
        error: error.message,
      },
      { status: 503 }
    );
  }
}
