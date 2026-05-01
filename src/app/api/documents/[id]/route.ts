import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { memberDocuments } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

// DELETE /api/documents/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.delete(memberDocuments).where(eq(memberDocuments.id, id));
  return NextResponse.json({ success: true });
}
