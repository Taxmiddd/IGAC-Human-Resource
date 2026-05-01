import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { financialLedger, members } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { sql, eq } from "drizzle-orm";

// GET /api/financial/summary — org-wide financial overview (core_admin only)
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || session.user.role !== "core_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [orgSummary, byMember, byType] = await Promise.all([
    // Org-wide totals
    db
      .select({
        totalAllotted: sql<number>`sum(allotted)`,
        totalDisbursed: sql<number>`sum(disbursed)`,
        transactionCount: sql<number>`count(*)`,
      })
      .from(financialLedger),

    // Per-member summary (top 20 by total disbursed)
    db
      .select({
        memberId: financialLedger.memberId,
        totalAllotted: sql<number>`sum(${financialLedger.allotted})`,
        totalDisbursed: sql<number>`sum(${financialLedger.disbursed})`,
        count: sql<number>`count(*)`,
      })
      .from(financialLedger)
      .groupBy(financialLedger.memberId)
      .orderBy(sql`sum(${financialLedger.disbursed}) desc`)
      .limit(20),

    // By transaction type
    db
      .select({
        type: financialLedger.transactionType,
        totalAllotted: sql<number>`sum(${financialLedger.allotted})`,
        totalDisbursed: sql<number>`sum(${financialLedger.disbursed})`,
        count: sql<number>`count(*)`,
      })
      .from(financialLedger)
      .groupBy(financialLedger.transactionType),
  ]);

  const total = orgSummary[0];

  return NextResponse.json({
    totalAllottedPaisa: total.totalAllotted ?? 0,
    totalDisbursedPaisa: total.totalDisbursed ?? 0,
    balancePaisa: (total.totalAllotted ?? 0) - (total.totalDisbursed ?? 0),
    transactionCount: total.transactionCount ?? 0,
    byMember,
    byType,
  });
}
