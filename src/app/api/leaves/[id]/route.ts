import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leaveRequests, members } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/leaves/[id] — approve or reject
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "core_admin") {
    return NextResponse.json({ error: "Forbidden — only core_admin can approve/reject" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status } = body;

  if (!["approved", "rejected", "pending"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await db
    .update(leaveRequests)
    .set({
      status: status as "pending" | "approved" | "rejected",
      approvedBy: session.user.id,
      updatedAt: new Date(),
    })
    .where(eq(leaveRequests.id, id))
    .returning();

  if (!updated.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: updated[0] });
}

// DELETE /api/leaves/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || session.user.role !== "core_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await db.delete(leaveRequests).where(eq(leaveRequests.id, id));
  return NextResponse.json({ success: true });
}
