import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/tasks/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { id: _id, createdAt: _ca, createdBy: _cb, ...safeBody } = body;

  const updated = await db
    .update(tasks)
    .set({ ...safeBody, updatedAt: new Date() })
    .where(eq(tasks.id, id))
    .returning();

  if (!updated.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: updated[0] });
}

// DELETE /api/tasks/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.update(tasks).set({ status: "cancelled", updatedAt: new Date() }).where(eq(tasks.id, id));
  return NextResponse.json({ success: true });
}
