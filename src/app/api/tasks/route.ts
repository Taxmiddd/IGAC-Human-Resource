import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, desc, and, like, sql } from "drizzle-orm";

// GET /api/tasks
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const assignedTo = searchParams.get("assignedTo");
  const priority = searchParams.get("priority");

  const conditions = [];
  if (status) conditions.push(eq(tasks.status, status as any));
  if (assignedTo) conditions.push(eq(tasks.assignedTo, assignedTo));
  if (priority) conditions.push(eq(tasks.priority, priority as any));
  const where = conditions.length ? and(...conditions) : undefined;

  const rows = await db.query.tasks.findMany({
    where,
    with: {
      assignee: { columns: { fullName: true, photoUrl: true, employeeId: true } },
      creator: { columns: { name: true } },
    },
    orderBy: [desc(tasks.createdAt)],
    limit: 200,
  });

  return NextResponse.json({ data: rows });
}

// POST /api/tasks
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const task = await db
    .insert(tasks)
    .values({ ...body, createdBy: session.user.id })
    .returning();

  return NextResponse.json({ data: task[0] }, { status: 201 });
}
