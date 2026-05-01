import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user, members, leaveRequests, tasks, financialLedger } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { sql, eq } from "drizzle-orm";

/**
 * GET /api/admin/stats — System-wide statistics (core_admin only)
 */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || session.user.role !== "core_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Get all stats in parallel
    const [
      userStats,
      memberStats,
      taskStats,
      leaveStats,
      financialStats,
    ] = await Promise.all([
      // User statistics
      db.select({
        total: sql<number>`count(*)`,
        admins: sql<number>`sum(case when role='core_admin' then 1 else 0 end)`,
        management: sql<number>`sum(case when role='management' then 1 else 0 end)`,
        banned: sql<number>`sum(case when banned then 1 else 0 end)`,
      }).from(user),

      // Member statistics
      db.select({
        total: sql<number>`count(*)`,
        active: sql<number>`sum(case when member_status='active' then 1 else 0 end)`,
        onLeave: sql<number>`sum(case when member_status='on_leave' then 1 else 0 end)`,
        resigned: sql<number>`sum(case when member_status='resigned' then 1 else 0 end)`,
        laidOff: sql<number>`sum(case when member_status='laid_off' then 1 else 0 end)`,
        responsive: sql<number>`sum(case when responsiveness='responsive' then 1 else 0 end)`,
      }).from(members),

      // Task statistics
      db.select({
        total: sql<number>`count(*)`,
        todo: sql<number>`sum(case when status='todo' then 1 else 0 end)`,
        inProgress: sql<number>`sum(case when status='in_progress' then 1 else 0 end)`,
        completed: sql<number>`sum(case when status='completed' then 1 else 0 end)`,
        overdue: sql<number>`sum(case when status!='completed' and due_date < datetime('now') then 1 else 0 end)`,
      }).from(tasks),

      // Leave statistics
      db.select({
        total: sql<number>`count(*)`,
        pending: sql<number>`sum(case when status='pending' then 1 else 0 end)`,
        approved: sql<number>`sum(case when status='approved' then 1 else 0 end)`,
        rejected: sql<number>`sum(case when status='rejected' then 1 else 0 end)`,
      }).from(leaveRequests),

      // Financial statistics
      db.select({
        totalAllotted: sql<number>`sum(allotted)`,
        totalDisbursed: sql<number>`sum(disbursed)`,
        balance: sql<number>`sum(allotted - disbursed)`,
        transactionCount: sql<number>`count(*)`,
      }).from(financialLedger),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users: userStats[0] || { total: 0, admins: 0, management: 0, banned: 0 },
        members: memberStats[0] || { total: 0, active: 0, onLeave: 0, resigned: 0, laidOff: 0, responsive: 0 },
        tasks: taskStats[0] || { total: 0, todo: 0, inProgress: 0, completed: 0, overdue: 0 },
        leaves: leaveStats[0] || { total: 0, pending: 0, approved: 0, rejected: 0 },
        financial: {
          totalAllottedPaisa: financialStats[0]?.totalAllotted || 0,
          totalDisbursedPaisa: financialStats[0]?.totalDisbursed || 0,
          balancePaisa: financialStats[0]?.balance || 0,
          transactionCount: financialStats[0]?.transactionCount || 0,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[Admin Stats Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics", details: error.message },
      { status: 500 }
    );
  }
}
