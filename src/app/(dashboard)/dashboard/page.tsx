import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { members, tasks, financialLedger, leaveRequests, departments } from "@/lib/db/schema";
import { eq, sql, and, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { formatBDT, formatDate } from "@/lib/utils";
import { Users, CheckSquare, TrendingUp, AlertCircle, Clock, CalendarDays, ChevronRight } from "lucide-react";
import Link from "next/link";

async function getDashboardData(isAdmin: boolean) {
  const now = new Date();
  
  const [memberStats, taskStats, finStats, leaves, overdueTasks, recentMembers] = await Promise.all([
    db.select({
      total: sql<number>`count(*)`,
      active: sql<number>`sum(case when member_status='active' then 1 else 0 end)`,
      onLeave: sql<number>`sum(case when member_status='on_leave' then 1 else 0 end)`,
    }).from(members),

    db.select({
      todo: sql<number>`sum(case when status='todo' then 1 else 0 end)`,
      inProgress: sql<number>`sum(case when status='in_progress' then 1 else 0 end)`,
    }).from(tasks),

    isAdmin ? db.select({
      allotted: sql<number>`sum(allotted)`,
      disbursed: sql<number>`sum(disbursed)`,
    }).from(financialLedger) : Promise.resolve([{ allotted: 0, disbursed: 0 }]),

    db.query.leaveRequests.findMany({
      where: eq(leaveRequests.status, "pending"),
      with: { member: { columns: { fullName: true, photoUrl: true } } },
      orderBy: [desc(leaveRequests.createdAt)],
      limit: 5,
    }),

    db.query.tasks.findMany({
      where: and(sql`status != 'completed'`, sql`status != 'cancelled'`, sql`due_date < ${now.getTime()}`),
      with: { assignee: { columns: { fullName: true, photoUrl: true } } },
      orderBy: [desc(tasks.dueDate)],
      limit: 5,
    }),

    db.query.members.findMany({
      with: { department: { columns: { name: true } } },
      orderBy: [desc(members.joiningDate)],
      limit: 5,
    })
  ]);

  return {
    stats: { members: memberStats[0], tasks: taskStats[0], fin: finStats[0] },
    leaves,
    overdueTasks,
    recentMembers,
  };
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const isAdmin = session?.user?.role === "core_admin";
  const data = await getDashboardData(isAdmin);

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700, color: "var(--color-foreground)" }}>
          Welcome back, {session?.user?.name?.split(" ")[0]} 👋
        </h1>
        <p style={{ color: "var(--color-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
          Here's what's happening at IGAC today.
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        {[
          { label: "Total Members", value: data.stats.members.total ?? 0, icon: Users, color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
          { label: "Active Members", value: data.stats.members.active ?? 0, icon: Users, color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
          { label: "On Leave", value: data.stats.members.onLeave ?? 0, icon: Clock, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
          { label: "Open Tasks", value: (data.stats.tasks.todo ?? 0) + (data.stats.tasks.inProgress ?? 0), icon: CheckSquare, color: "#a855f7", bg: "rgba(168,85,247,0.1)" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontSize: "0.75rem", color: "var(--color-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>{label}</p>
                <p style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-foreground)", lineHeight: 1 }}>{value}</p>
              </div>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={20} color={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Pending Leaves */}
          <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <CalendarDays size={16} /> Pending Leaves
              </h2>
              <Link href="/leaves" style={{ fontSize: "0.75rem", color: "var(--color-muted)", display: "flex", alignItems: "center" }}>View All <ChevronRight size={12}/></Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {data.leaves.length === 0 ? <p style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>No pending leaves.</p> :
                data.leaves.map(l => (
                  <div key={l.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--color-forest-800)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", color: "var(--color-primary)", fontWeight: 700 }}>
                      {l.member?.fullName[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-foreground)" }}>{l.member?.fullName}</p>
                      <p style={{ fontSize: "0.7rem", color: "var(--color-muted)" }}>{l.type} · {formatDate(l.startDate)} - {formatDate(l.endDate)}</p>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Overdue Tasks */}
          <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <AlertCircle size={16} /> Overdue Tasks
              </h2>
              <Link href="/tasks" style={{ fontSize: "0.75rem", color: "var(--color-muted)", display: "flex", alignItems: "center" }}>View All <ChevronRight size={12}/></Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {data.overdueTasks.length === 0 ? <p style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>No overdue tasks!</p> :
                data.overdueTasks.map(t => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.1)", borderRadius: "8px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-foreground)" }}>{t.title}</p>
                      <p style={{ fontSize: "0.7rem", color: "var(--color-muted)" }}>Due: {formatDate(t.dueDate)} {t.assignee && `· Assignee: ${t.assignee.fullName}`}</p>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Financial Summary */}
          {isAdmin && (
            <div className="card" style={{ padding: "1.25rem", background: "linear-gradient(135deg, rgba(32,201,151,0.05), var(--color-card))", borderColor: "rgba(32,201,151,0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h2 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <TrendingUp size={16} /> Financial Overview
                </h2>
                <Link href="/ledger" style={{ fontSize: "0.75rem", color: "var(--color-muted)", display: "flex", alignItems: "center" }}>View Ledger <ChevronRight size={12}/></Link>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <p style={{ fontSize: "0.7rem", color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Disbursed</p>
                  <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-foreground)" }}>{formatBDT(data.stats.fin.disbursed ?? 0)}</p>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                    <span style={{ color: "var(--color-muted)" }}>Budget Utilization</span>
                    <span style={{ color: "var(--color-foreground)", fontWeight: 600 }}>
                      {((data.stats.fin.disbursed ?? 0) / (data.stats.fin.allotted || 1) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ height: "6px", background: "var(--color-forest-800)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, ((data.stats.fin.disbursed ?? 0) / (data.stats.fin.allotted || 1)) * 100)}%`, background: "var(--color-primary)", borderRadius: "3px" }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Members */}
          <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Users size={16} /> Newest Members
              </h2>
              <Link href="/members" style={{ fontSize: "0.75rem", color: "var(--color-muted)", display: "flex", alignItems: "center" }}>Directory <ChevronRight size={12}/></Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {data.recentMembers.length === 0 ? <p style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>No members found.</p> :
                data.recentMembers.map(m => (
                  <Link key={m.id} href={`/members/${m.id}`} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem", borderRadius: "8px", textDecoration: "none", transition: "background 0.2s" }} className="hover:bg-forest-900">
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--color-forest-800)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", color: "var(--color-primary)", fontWeight: 700 }}>
                      {m.fullName[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-foreground)" }}>{m.fullName}</p>
                      <p style={{ fontSize: "0.7rem", color: "var(--color-muted)" }}>Joined {formatDate(m.joiningDate)} {m.department && `· ${m.department.name}`}</p>
                    </div>
                  </Link>
                ))
              }
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
