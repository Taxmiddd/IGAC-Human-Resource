"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import {
  LayoutDashboard, Users, BookOpen, CheckSquare, Settings,
  LogOut, Menu, X, ChevronRight, Shield, Bell, CalendarDays, AlertCircle
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["core_admin", "management"] },
  { href: "/members", label: "Members", icon: Users, roles: ["core_admin", "management"] },
  { href: "/tasks", label: "Tasks", icon: CheckSquare, roles: ["core_admin", "management"] },
  { href: "/leaves", label: "Leaves", icon: CalendarDays, roles: ["core_admin", "management"] },
  { href: "/ledger", label: "Financial Ledger", icon: BookOpen, roles: ["core_admin"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["core_admin"] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const role = session?.user?.role ?? "management";

  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [overdueTasks, setOverdueTasks] = useState(0);

  useEffect(() => {
    if (!session?.user) return;
    Promise.all([
      fetch("/api/leaves?limit=1&status=pending").then(r => r.json()),
      fetch("/api/tasks").then(r => r.json())
    ]).then(([leavesJson, tasksJson]) => {
      setPendingLeaves(leavesJson.pendingCount ?? 0);
      const tasks = tasksJson.data ?? [];
      const now = Date.now();
      setOverdueTasks(tasks.filter((t: any) => t.dueDate && new Date(t.dueDate).getTime() < now && t.status !== "completed").length);
    }).catch(console.error);
  }, [session?.user]);

  const filteredNav = NAV_ITEMS.filter((item) => item.roles.includes(role));

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  const totalNotifications = pendingLeaves + overdueTasks;

  return (
    <div style={{ display: "flex", minHeight: "100dvh" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="overlay"
          style={{ zIndex: 39 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${sidebarOpen ? "open" : ""}`}
        style={{ zIndex: 40 }}
      >
        {/* Brand */}
        <div style={{
          padding: "1.5rem",
          borderBottom: "1px solid var(--color-border)",
          display: "flex", alignItems: "center", gap: "0.75rem",
        }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
            background: "linear-gradient(135deg, var(--color-mint-300), var(--color-mint-500))",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 16px rgba(32, 201, 151, 0.25)",
            overflow: "hidden",
            padding: "4px"
          }}>
            <Image src="/IGAC Logo OG NOBG.svg" alt="IGAC Logo" width={28} height={28} style={{ objectFit: "contain" }} />
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-playfair)", fontWeight: 700, fontSize: "1rem", color: "var(--color-foreground)", lineHeight: 1.2 }}>
              IGAC HR
            </div>
            <div style={{ fontSize: "0.65rem", color: "var(--color-muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Internal Portal
            </div>
          </div>
          <button
            className="btn btn-ghost"
            onClick={() => setSidebarOpen(false)}
            style={{ marginLeft: "auto", padding: "0.25rem", display: "none" }}
            id="sidebar-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Role Badge */}
        <div style={{ padding: "0.75rem 1.5rem" }}>
          <span className="badge" style={{
            background: role === "core_admin" ? "rgba(32, 201, 151, 0.12)" : "rgba(4, 63, 51, 0.5)",
            color: role === "core_admin" ? "var(--color-primary)" : "var(--color-muted-foreground)",
            border: `1px solid ${role === "core_admin" ? "rgba(32, 201, 151, 0.3)" : "var(--color-border-subtle)"}`,
          }}>
            <Shield size={10} />
            {role === "core_admin" ? "Core Admin" : "Management"}
          </span>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "0.5rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {filteredNav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.75rem",
                  padding: "0.6rem 0.875rem", borderRadius: "8px",
                  textDecoration: "none", fontSize: "0.875rem", fontWeight: 500,
                  transition: "all 0.2s ease",
                  background: active ? "rgba(32, 201, 151, 0.12)" : "transparent",
                  color: active ? "var(--color-primary)" : "var(--color-muted-foreground)",
                  borderLeft: active ? "2px solid var(--color-primary)" : "2px solid transparent",
                }}
              >
                <Icon size={17} />
                <span style={{ flex: 1 }}>{label}</span>
                {href === "/leaves" && pendingLeaves > 0 && (
                  <span style={{ background: "#f59e0b", color: "#fff", fontSize: "0.65rem", padding: "0.1rem 0.35rem", borderRadius: "10px", fontWeight: 700 }}>{pendingLeaves}</span>
                )}
                {href === "/tasks" && overdueTasks > 0 && (
                  <span style={{ background: "#ef4444", color: "#fff", fontSize: "0.65rem", padding: "0.1rem 0.35rem", borderRadius: "10px", fontWeight: 700 }}>{overdueTasks}</span>
                )}
                {active && <ChevronRight size={14} style={{ marginLeft: "auto", opacity: 0.6 }} />}
              </Link>
            );
          })}
        </nav>

        {/* User info + signout */}
        <div style={{
          padding: "1rem 1.5rem",
          borderTop: "1px solid var(--color-border-subtle)",
          display: "flex", alignItems: "center", gap: "0.75rem",
        }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, var(--color-forest-800), var(--color-forest-600))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.75rem", fontWeight: 700, color: "var(--color-primary)",
          }}>
            {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {session?.user?.name ?? "User"}
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--color-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {session?.user?.email}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="btn btn-ghost"
            title="Sign out"
            style={{ padding: "0.35rem", flexShrink: 0 }}
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* NOÉTIC Footer */}
        <div style={{ padding: "0.75rem 1.5rem", borderTop: "1px solid var(--color-border-subtle)" }}>
          <p style={{ fontSize: "0.65rem", color: "var(--color-muted)", textAlign: "center" }}>
            Developed by{" "}
            <a href="https://noeticstudio.net" target="_blank" rel="noopener noreferrer"
              style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}>
              NOÉTIC Studio
            </a>
          </p>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content" style={{ flex: 1 }}>
        {/* Topbar */}
        <header style={{
          height: "56px", display: "flex", alignItems: "center",
          padding: "0 1.5rem", gap: "1rem",
          borderBottom: "1px solid var(--color-border-subtle)",
          background: "rgba(1, 18, 15, 0.8)", backdropFilter: "blur(12px)",
          position: "sticky", top: 0, zIndex: 30,
        }}>
          <button
            className="btn btn-ghost"
            onClick={() => setSidebarOpen(true)}
            style={{ padding: "0.35rem" }}
            id="sidebar-open-btn"
          >
            <Menu size={20} />
          </button>
          <div style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>
            {filteredNav.find((n) => pathname.startsWith(n.href))?.label ?? "IGAC HR Portal"}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.5rem", position: "relative" }}>
            <button className="btn btn-ghost" style={{ padding: "0.35rem", position: "relative" }} title="Notifications" onClick={() => setShowNotifications(v => !v)}>
              <Bell size={18} />
              {totalNotifications > 0 && (
                <span style={{ position: "absolute", top: "2px", right: "2px", background: "#ef4444", color: "#fff", fontSize: "0.5rem", width: "12px", height: "12px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                  {totalNotifications}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="card" style={{
                position: "absolute", top: "100%", right: 0, marginTop: "0.5rem",
                width: "280px", padding: "0.5rem 0", zIndex: 50,
                boxShadow: "0 10px 40px rgba(0,0,0,0.5)", border: "1px solid var(--color-border)",
              }}>
                <div style={{ padding: "0.5rem 1rem", borderBottom: "1px solid var(--color-border-subtle)", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", justifyContent: "space-between" }}>
                  Notifications
                  <button className="btn btn-ghost" style={{ padding: 0, fontSize: "0.7rem", height: "auto" }} onClick={() => setShowNotifications(false)}>Clear</button>
                </div>
                {totalNotifications === 0 ? (
                  <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--color-muted)", fontSize: "0.8rem" }}>No new notifications</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {pendingLeaves > 0 && (
                      <Link href="/leaves" onClick={() => setShowNotifications(false)} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", textDecoration: "none", borderBottom: "1px solid var(--color-border-subtle)", background: "rgba(245,158,11,0.05)" }}>
                        <div style={{ color: "#f59e0b" }}><CalendarDays size={16} /></div>
                        <div>
                          <div style={{ fontSize: "0.8rem", color: "var(--color-foreground)", fontWeight: 500 }}>{pendingLeaves} Pending Leaves</div>
                          <div style={{ fontSize: "0.7rem", color: "var(--color-muted)" }}>Action required</div>
                        </div>
                      </Link>
                    )}
                    {overdueTasks > 0 && (
                      <Link href="/tasks" onClick={() => setShowNotifications(false)} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", textDecoration: "none", background: "rgba(239,68,68,0.05)" }}>
                        <div style={{ color: "#ef4444" }}><AlertCircle size={16} /></div>
                        <div>
                          <div style={{ fontSize: "0.8rem", color: "var(--color-foreground)", fontWeight: 500 }}>{overdueTasks} Overdue Tasks</div>
                          <div style={{ fontSize: "0.7rem", color: "var(--color-muted)" }}>Please review and update</div>
                        </div>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: "1.5rem 2rem" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
