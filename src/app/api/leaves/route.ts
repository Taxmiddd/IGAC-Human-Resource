import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leaveRequests, members } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { desc, eq, and, sql } from "drizzle-orm";

// GET /api/leaves — list leave requests
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 50));
  const offset = (page - 1) * limit;
  const status = searchParams.get("status");
  const memberId = searchParams.get("memberId");

  const conditions = [];
  if (status) conditions.push(eq(leaveRequests.status, status as "pending" | "approved" | "rejected"));
  if (memberId) conditions.push(eq(leaveRequests.memberId, memberId));
  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db.query.leaveRequests.findMany({
      where,
      with: {
        member: { columns: { fullName: true, employeeId: true, photoUrl: true, departmentId: true } },
        approver: { columns: { name: true } },
      },
      orderBy: [desc(leaveRequests.createdAt)],
      limit,
      offset,
    }),
    db.select({ count: sql<number>`count(*)` }).from(leaveRequests).where(where),
  ]);

  // Count pending for badge
  const [pendingCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(leaveRequests)
    .where(eq(leaveRequests.status, "pending"));

  return NextResponse.json({
    data: rows,
    total: countResult[0].count,
    pendingCount: pendingCount.count,
    page,
    limit,
  });
}

// POST /api/leaves — submit a leave request
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { memberId, type, startDate, endDate, reason } = body;

  if (!memberId || !type || !startDate || !endDate || !reason) {
    return NextResponse.json({ error: "memberId, type, startDate, endDate, and reason are required" }, { status: 400 });
  }

  const record = await db
    .insert(leaveRequests)
    .values({
      memberId,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      status: "pending",
    })
    .returning();

  return NextResponse.json({ data: record[0] }, { status: 201 });
}
