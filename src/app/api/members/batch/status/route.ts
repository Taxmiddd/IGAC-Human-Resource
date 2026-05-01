import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { members, memberStatusLog } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { inArray, eq } from "drizzle-orm";

/**
 * POST /api/members/batch/status — Update status for multiple members
 * Useful for bulk actions like "mark all as visited"
 */
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { memberIds, field, newValue, reason } = await req.json();

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: "memberIds array is required" }, { status: 400 });
    }

    if (!field || !newValue) {
      return NextResponse.json({ error: "field and newValue are required" }, { status: 400 });
    }

    const ALLOWED_FIELDS = ["memberStatus", "activeness", "responsiveness"] as const;
    if (!ALLOWED_FIELDS.includes(field)) {
      return NextResponse.json({ error: "Invalid field" }, { status: 400 });
    }

    // Get current values for audit trail
    const currentMembers = await db.query.members.findMany({
      where: inArray(members.id, memberIds),
      columns: { id: true, [field]: true },
    });

    const updateMap = new Map(currentMembers.map(m => [m.id, m[field as keyof typeof m]]));

    // Update all members
    await db
      .update(members)
      .set({ [field]: newValue, updatedAt: new Date() })
      .where(inArray(members.id, memberIds));

    // Create audit log entries for each member
    const logsToInsert = Array.from(updateMap.entries()).map(([memberId, oldValue]) => ({
      memberId,
      field,
      oldValue: String(oldValue),
      newValue: String(newValue),
      reason: reason || `Batch update: ${field}`,
      changedBy: session.user.id,
    }));

    await db.insert(memberStatusLog).values(logsToInsert);

    return NextResponse.json({
      success: true,
      updated: memberIds.length,
      message: `Updated ${memberIds.length} members`,
    });
  } catch (error: any) {
    console.error("[Batch Member Update Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
