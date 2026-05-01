import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { members, tasks, leaveRequests, memberDocuments } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { like, eq, or, and } from "drizzle-orm";

/**
 * Global search across members, tasks, documents, leaves
 * GET /api/search?q=keyword
 */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  
  if (!query || query.length < 2) {
    return NextResponse.json({ data: { members: [], tasks: [], leaves: [], documents: [] } });
  }

  const searchPattern = `%${query}%`;

  try {
    // Search members
    const foundMembers = await db.query.members.findMany({
      where: or(
        like(members.fullName, searchPattern),
        like(members.email, searchPattern),
        like(members.employeeId, searchPattern)
      ),
      columns: {
        id: true,
        fullName: true,
        employeeId: true,
        email: true,
        photoUrl: true,
      },
      limit: 5,
    });

    // Search tasks
    const foundTasks = await db.query.tasks.findMany({
      where: like(tasks.title, searchPattern),
      with: { assignee: { columns: { fullName: true, photoUrl: true } } },
      columns: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
      },
      limit: 5,
    });

    // Search leaves (by member name or reason)
    const foundLeaves = await db.query.leaveRequests.findMany({
      where: like(leaveRequests.reason, searchPattern),
      with: { member: { columns: { id: true, fullName: true, photoUrl: true } } },
      columns: {
        id: true,
        type: true,
        status: true,
        startDate: true,
        endDate: true,
      },
      limit: 5,
    });

    // Search documents
    const foundDocuments = await db.query.memberDocuments.findMany({
      where: like(memberDocuments.name, searchPattern),
      with: { member: { columns: { id: true, fullName: true } } },
      columns: {
        id: true,
        name: true,
        documentType: true,
        uploadedAt: true,
      },
      limit: 5,
    });

    return NextResponse.json({
      data: {
        members: foundMembers,
        tasks: foundTasks,
        leaves: foundLeaves,
        documents: foundDocuments,
      },
    });
  } catch (error: any) {
    console.error("[Search Error]", error);
    return NextResponse.json(
      { error: "Search failed", details: error.message },
      { status: 500 }
    );
  }
}
