import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { financialLedger, members } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, desc, and, sql } from "drizzle-orm";

// GET /api/financial/ledger — all transactions (core_admin only)
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || session.user.role !== "core_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 50));
  const offset = (page - 1) * limit;
  const memberId = searchParams.get("memberId");
  const type = searchParams.get("type");

  const conditions = [];
  if (memberId) conditions.push(eq(financialLedger.memberId, memberId));
  if (type) conditions.push(eq(financialLedger.transactionType, type as any));
  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db.query.financialLedger.findMany({
      where,
      with: { member: { columns: { fullName: true, employeeId: true, photoUrl: true } }, recorder: { columns: { name: true } } },
      orderBy: [desc(financialLedger.recordedAt)],
      limit,
      offset,
    }),
    db.select({ count: sql<number>`count(*)` }).from(financialLedger).where(where),
  ]);

  return NextResponse.json({ data: rows, total: countResult[0].count, page, limit });
}

// POST /api/financial/ledger — record a new transaction (core_admin only)
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || session.user.role !== "core_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { memberId, transactionType, purpose, eventName, allottedTaka, disbursedTaka, periodMonth, periodYear, notes } = body;

  if (!memberId || !transactionType || !purpose) {
    return NextResponse.json({ error: "memberId, transactionType, and purpose are required" }, { status: 400 });
  }

  // Store in paisa
  const record = await db
    .insert(financialLedger)
    .values({
      memberId,
      transactionType,
      purpose,
      eventName: eventName ?? null,
      allotted: Math.round((allottedTaka ?? 0) * 100),
      disbursed: Math.round((disbursedTaka ?? 0) * 100),
      currency: "BDT",
      periodMonth: periodMonth ?? null,
      periodYear: periodYear ?? null,
      notes: notes ?? null,
      recordedBy: session.user.id,
    })
    .returning();

  return NextResponse.json({ data: record[0] }, { status: 201 });
}
