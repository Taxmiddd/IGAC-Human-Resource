import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { members, memberStatusLog } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/members/[id]/status — change lifecycle, activeness, or responsiveness
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { field, newValue, reason } = await req.json();

  const ALLOWED_FIELDS = ["memberStatus", "activeness", "responsiveness"] as const;
  if (!ALLOWED_FIELDS.includes(field)) {
    return NextResponse.json({ error: "Invalid field" }, { status: 400 });
  }

  // Get current value for the log
  const current = await db.query.members.findFirst({ where: eq(members.id, id) });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const oldValue = current[field as keyof typeof current] as string;

  // Update member
  await db
    .update(members)
    .set({ [field]: newValue, updatedAt: new Date() })
    .where(eq(members.id, id));

  // Append to status log (immutable)
  await db.insert(memberStatusLog).values({
    memberId: id,
    field,
    oldValue,
    newValue,
    reason: reason ?? null,
    changedBy: session.user.id,
  });

  return NextResponse.json({ success: true, field, oldValue, newValue });
}
