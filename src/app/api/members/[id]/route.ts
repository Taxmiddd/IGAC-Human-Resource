import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { members, memberStatusLog } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

// GET /api/members/[id]
export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const member = await db.query.members.findFirst({
      where: eq(members.id, id),
      with: {
        department: true,
        statusLogs: { orderBy: (log, { desc }) => [desc(log.changedAt)], limit: 20 },
        tasks: { orderBy: (t, { desc }) => [desc(t.createdAt)], limit: 10 },
        financialRecords: { orderBy: (f, { desc }) => [desc(f.recordedAt)], limit: 10 },
        leaveRequests: { orderBy: (l, { desc }) => [desc(l.createdAt)], limit: 10 },
      },
    });

    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: member });
  } catch (error: any) {
    console.error("[Member GET Error]", error);
    return NextResponse.json({ error: "Failed to fetch member", details: error.message }, { status: 500 });
  }
}

// PATCH /api/members/[id] — update member profile with validation
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  
  try {
    const body = await req.json();

    // Protect audit fields from modification
    const { id: _id, createdAt: _ca, createdBy: _cb, employeeId: _eid, ...updateData } = body;

    // Validate email format if email is being updated
    if (updateData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
      }

      // Check if email is already taken by another member
      const existing = await db.query.members.findFirst({
        where: eq(members.email, updateData.email),
        columns: { id: true },
      });
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }
    }

    // Get current member data for change tracking
    const currentMember = await db.query.members.findFirst({
      where: eq(members.id, id),
    });

    if (!currentMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Update member
    const updated = await db
      .update(members)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(members.id, id))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updated[0] }, { status: 200 });
  } catch (error: any) {
    console.error("[Member PATCH Error]", error);
    return NextResponse.json({ error: "Failed to update member", details: error.message }, { status: 500 });
  }
}

// DELETE /api/members/[id] — soft delete (set laid_off + inactive, requires core_admin)
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "core_admin") {
    return NextResponse.json({ error: "Only core_admin can delete members" }, { status: 403 });
  }

  const { id } = await params;
  
  try {
    // Soft delete: mark as laid_off and inactive
    const updated = await db
      .update(members)
      .set({
        memberStatus: "laid_off",
        activeness: "inactive",
        resignationDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(members.id, id))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Log this action
    await db.insert(memberStatusLog).values({
      memberId: id,
      field: "member_status",
      oldValue: updated[0].memberStatus,
      newValue: "laid_off",
      reason: "Deleted by admin",
      changedBy: session.user.id,
    });

    return NextResponse.json({ success: true, message: "Member deleted (soft)" });
  } catch (error: any) {
    console.error("[Member DELETE Error]", error);
    return NextResponse.json({ error: "Failed to delete member", details: error.message }, { status: 500 });
  }
}
