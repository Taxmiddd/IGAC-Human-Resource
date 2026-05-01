import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { members, departments } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, like, and, desc, sql } from "drizzle-orm";
import { generateEmployeeId } from "@/lib/utils";

// GET /api/members — paginated list with search & filters
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 25));
  const offset = (page - 1) * limit;
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status");
  const activeness = searchParams.get("activeness");
  const responsiveness = searchParams.get("responsiveness");
  const departmentId = searchParams.get("departmentId");

  const conditions = [];
  if (search) conditions.push(like(members.fullName, `%${search}%`));
  if (status) conditions.push(eq(members.memberStatus, status as any));
  if (activeness) conditions.push(eq(members.activeness, activeness as any));
  if (responsiveness) conditions.push(eq(members.responsiveness, responsiveness as any));
  if (departmentId) conditions.push(eq(members.departmentId, departmentId));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db.query.members.findMany({
      where,
      with: { department: true },
      orderBy: [desc(members.createdAt)],
      limit,
      offset,
    }),
    db.select({ count: sql<number>`count(*)` }).from(members).where(where),
  ]);

  return NextResponse.json({
    data: rows,
    total: countResult[0].count,
    page,
    limit,
  });
}

// POST /api/members — create new member (admin-only onboarding)
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Auto-generate employee ID
  const countResult = await db.select({ count: sql<number>`count(*)` }).from(members);
  const employeeId = generateEmployeeId(countResult[0].count);

  const member = await db
    .insert(members)
    .values({
      ...body,
      employeeId,
      createdBy: session.user.id,
    })
    .returning();

  return NextResponse.json({ data: member[0] }, { status: 201 });
}
