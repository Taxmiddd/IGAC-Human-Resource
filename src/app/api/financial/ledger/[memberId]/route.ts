import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { financialLedger } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, desc, sql } from "drizzle-orm";

type Params = { params: Promise<{ memberId: string }> };

// GET /api/financial/ledger/[memberId] — single member's financial history
export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || session.user.role !== "core_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { memberId } = await params;

  const [rows, summary] = await Promise.all([
    db.query.financialLedger.findMany({
      where: eq(financialLedger.memberId, memberId),
      with: { recorder: { columns: { name: true } } },
      orderBy: [desc(financialLedger.recordedAt)],
    }),
    db
      .select({
        totalAllotted: sql<number>`sum(allotted)`,
        totalDisbursed: sql<number>`sum(disbursed)`,
      })
      .from(financialLedger)
      .where(eq(financialLedger.memberId, memberId)),
  ]);

  const { totalAllotted = 0, totalDisbursed = 0 } = summary[0];
  const balance = (totalAllotted ?? 0) - (totalDisbursed ?? 0);

  return NextResponse.json({
    data: rows,
    summary: {
      totalAllottedPaisa: totalAllotted ?? 0,
      totalDisbursedPaisa: totalDisbursed ?? 0,
      balancePaisa: balance,
    },
  });
}
