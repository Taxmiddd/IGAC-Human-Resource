import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { departments } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

// GET /api/departments
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.query.departments.findMany({ orderBy: (d, { asc }) => [asc(d.name)] });
  return NextResponse.json({ data: rows });
}

// POST /api/departments — core_admin only
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || session.user.role !== "core_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, description } = await req.json();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const dept = await db.insert(departments).values({ name, description, createdBy: session.user.id }).returning();
  return NextResponse.json({ data: dept[0] }, { status: 201 });
}

// DELETE /api/departments?id=xxx — core_admin only
export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || session.user.role !== "core_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await db.delete(departments).where(eq(departments.id, id));
  return NextResponse.json({ success: true });
}
