import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/admin/users/[id] — change role or ban status
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || session.user.role !== "core_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  // Prevent self-demotion
  if (id === session.user.id && body.role === "management") {
    return NextResponse.json({ error: "Cannot demote your own account" }, { status: 400 });
  }

  const allowedFields: Record<string, unknown> = {};
  if (body.role !== undefined) allowedFields.role = body.role;
  if (body.banned !== undefined) allowedFields.banned = body.banned;

  const updated = await db
    .update(user)
    .set(allowedFields)
    .where(eq(user.id, id))
    .returning({ id: user.id, name: user.name, email: user.email, role: user.role, banned: user.banned });

  if (!updated.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: updated[0] });
}

// DELETE /api/admin/users/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || session.user.role !== "core_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (id === session.user.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  await db.delete(user).where(eq(user.id, id));
  return NextResponse.json({ success: true });
}
