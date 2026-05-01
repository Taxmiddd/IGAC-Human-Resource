"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Settings, Shield, Users, AlertTriangle, Key, Mail, Copy, Check } from "lucide-react";
import { useSession, authClient } from "@/lib/auth-client";

type Dept = { id: string; name: string; description?: string | null };
type UserRow = { id: string; name: string; email: string; role: string; banned: boolean };

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"departments" | "users" | "system">("departments");
  
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [newDept, setNewDept] = useState({ name: "", description: "" });
  const [deptLoading, setDeptLoading] = useState(false);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Invitation state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"core_admin" | "management">("management");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  const isAdmin = session?.user?.role === "core_admin" || session?.user?.role === "founder";
  const isFounder = session?.user?.role === "founder";

  const fetchDepts = useCallback(async () => {
    const res = await fetch("/api/departments");
    const json = await res.json();
    setDepartments(json.data ?? []);
  }, []);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    const res = await fetch("/api/admin/users");
    const json = await res.json();
    setUsers(json.data ?? []);
    setUsersLoading(false);
  }, []);

  useEffect(() => {
    fetchDepts();
    if (isAdmin) {
      fetchUsers();
    }
  }, [fetchDepts, fetchUsers, isAdmin]);

  async function addDept(e: React.FormEvent) {
    e.preventDefault();
    if (!newDept.name) { toast.error("Department name is required"); return; }
    setDeptLoading(true);
    const res = await fetch("/api/departments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newDept),
    });
    if (!res.ok) { toast.error("Failed to create department"); setDeptLoading(false); return; }
    toast.success("Department created");
    setNewDept({ name: "", description: "" });
    await fetchDepts();
    setDeptLoading(false);
  }

  async function deleteDept(id: string) {
    if (!confirm("Delete this department? Members assigned to it will be unlinked.")) return;
    await fetch(`/api/departments?id=${id}`, { method: "DELETE" });
    toast.success("Department deleted");
    await fetchDepts();
  }

  async function updateUserRole(id: string, role: string) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error || "Failed"); return; }
    toast.success("User role updated");
    fetchUsers();
  }

  async function toggleBan(id: string, banned: boolean) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ banned: !banned }),
    });
    if (!res.ok) { toast.error("Failed"); return; }
    toast.success(banned ? "User unbanned" : "User banned");
    fetchUsers();
  }

  async function deleteUser(id: string) {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error || "Failed"); return; }
    toast.success("User deleted");
    fetchUsers();
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviteLoading(true);
    setGeneratedLink("");

    const res = await fetch("/api/admin/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });

    const json = await res.json();

    if (!res.ok) {
      toast.error(json.error || "Failed to create invitation");
      setInviteLoading(false);
      return;
    }

    if (json.data) {
      const link = `${window.location.origin}/accept-invitation?id=${json.data.id}`;
      setGeneratedLink(link);
      toast.success("Invitation link generated!");
    }
    setInviteLoading(false);
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied to clipboard");
  };

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "800px" }}>
      <div>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.5rem", fontWeight: 700, color: "var(--color-foreground)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Settings size={22} color="var(--color-primary)" /> System Settings
        </h1>
        <p style={{ color: "var(--color-muted)", fontSize: "0.8rem", marginTop: "0.2rem" }}>
          {session?.user?.role === "founder" ? "Founder Access — Full system control" : "Admin — Portal configuration"}
        </p>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--color-border-subtle)", overflowX: "auto" }}>
        {[
          { key: "departments", label: "Departments", icon: Users },
          { key: "users", label: "User Management", icon: Key },
          { key: "system", label: "System Information", icon: AlertTriangle },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            style={{
              display: "flex", alignItems: "center", gap: "0.45rem",
              padding: "0.65rem 1.1rem", background: "none", border: "none",
              borderBottom: activeTab === key ? "2px solid var(--color-primary)" : "2px solid transparent",
              color: activeTab === key ? "var(--color-primary)" : "var(--color-muted)",
              fontSize: "0.82rem", fontWeight: activeTab === key ? 600 : 400,
              cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
            }}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {activeTab === "departments" && (
        <div className="card" style={{ padding: "1.5rem" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1rem", fontWeight: 700, color: "var(--color-foreground)", marginBottom: "1.25rem" }}>
            Manage Departments
          </h2>
          <form onSubmit={addDept} style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
            <input className="input" placeholder="Department name…" value={newDept.name}
              onChange={e => setNewDept(p => ({ ...p, name: e.target.value }))}
              style={{ flex: "1 1 180px" }} />
            <input className="input" placeholder="Description (optional)" value={newDept.description}
              onChange={e => setNewDept(p => ({ ...p, description: e.target.value }))}
              style={{ flex: "2 1 240px" }} />
            <button type="submit" className="btn btn-primary" disabled={deptLoading} style={{ flexShrink: 0 }}>
              <Plus size={15} /> Add
            </button>
          </form>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {departments.length === 0 ? (
              <p style={{ color: "var(--color-muted)", fontSize: "0.85rem", textAlign: "center", padding: "1.5rem" }}>No departments yet</p>
            ) : (
              departments.map(dept => (
                <div key={dept.id} style={{
                  display: "flex", alignItems: "center", gap: "1rem",
                  padding: "0.75rem 1rem", background: "rgba(255,255,255,0.03)",
                  borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-foreground)" }}>{dept.name}</div>
                    {dept.description && <div style={{ fontSize: "0.75rem", color: "var(--color-muted-foreground)" }}>{dept.description}</div>}
                  </div>
                  <button onClick={() => deleteDept(dept.id)} className="btn btn-ghost" style={{ padding: "0.3rem", color: "#ef4444" }} title="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {isFounder && (
            <div className="card" style={{ padding: "1.5rem", border: "1px dashed var(--color-primary-subtle)" }}>
              <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1rem", fontWeight: 700, color: "var(--color-foreground)", marginBottom: "1rem" }}>
                <Mail size={16} color="var(--color-primary)" /> Invite New User
              </h2>
              <form onSubmit={handleInvite} style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ flex: "2 1 240px", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>Email Address</label>
                  <input className="input" type="email" placeholder="invitee@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
                </div>
                <div style={{ flex: "1 1 150px", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>Role</label>
                  <select className="input" value={inviteRole} onChange={e => setInviteRole(e.target.value as any)}>
                    <option value="management">Management</option>
                    <option value="core_admin">Core Admin</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" disabled={inviteLoading} style={{ height: "42px" }}>
                  {inviteLoading ? "Generating..." : "Generate Link"}
                </button>
              </form>

              {generatedLink && (
                <div style={{ marginTop: "1.25rem", padding: "1rem", background: "rgba(184, 158, 101, 0.05)", borderRadius: "8px", border: "1px solid rgba(184, 158, 101, 0.2)" }}>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-primary)", fontWeight: 600, marginBottom: "0.5rem" }}>Share this link with the invitee:</p>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input className="input" readOnly value={generatedLink} style={{ fontSize: "0.75rem", fontFamily: "monospace", background: "rgba(0,0,0,0.2)" }} />
                    <button onClick={copyToClipboard} className="btn btn-secondary" style={{ padding: "0 0.75rem" }}>
                      {copied ? <Check size={16} color="#22c55e" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="card" style={{ overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 4 }).map((_, j) => <td key={j}><div className="skeleton" style={{ height: "16px", width: "80%" }} /></td>)}</tr>
                  ))
                ) : users.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: "var(--color-muted)" }}>No users found</td></tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--color-foreground)" }}>{u.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>{u.email}</div>
                      </td>
                      <td>
                        {isFounder ? (
                          <select className="input" style={{ width: "130px", fontSize: "0.75rem", padding: "0.25rem 0.5rem" }} value={u.role} onChange={(e) => updateUserRole(u.id, e.target.value)} disabled={u.id === session?.user?.id}>
                            <option value="founder">Founder</option>
                            <option value="core_admin">Core Admin</option>
                            <option value="management">Management</option>
                          </select>
                        ) : (
                          <span style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>{u.role}</span>
                        )}
                      </td>
                      <td>
                        <span className="badge" style={{ background: u.banned ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)", color: u.banned ? "#ef4444" : "#22c55e" }}>
                          {u.banned ? "Banned" : "Active"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
                          <button className="btn btn-secondary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }} onClick={() => toggleBan(u.id, u.banned)} disabled={u.id === session?.user?.id || (!isFounder && u.role === "founder")}>
                            {u.banned ? "Unban" : "Ban"}
                          </button>
                          <button className="btn btn-ghost" style={{ padding: "0.25rem 0.5rem", color: "#ef4444" }} onClick={() => deleteUser(u.id)} disabled={u.id === session?.user?.id || (!isFounder && u.role === "founder")}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "system" && (
        <>
          <div className="card" style={{ padding: "1.5rem" }}>
            <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1rem", fontWeight: 700, color: "var(--color-foreground)", marginBottom: "1rem" }}>
              <Shield size={17} color="var(--color-primary)" /> System Information
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { label: "Application", value: "IGAC HR Portal" },
                { label: "Database", value: "Turso (libSQL/SQLite)" },
                { label: "Authentication", value: "Better Auth" },
                { label: "Invitation System", value: "Manual Link (Founder Only)" },
                { label: "Theme", value: "IGAC Navy & Gold" },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", padding: "0.5rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ color: "var(--color-muted)" }}>{label}</span>
                  <span style={{ color: "var(--color-foreground)", fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: "1.5rem", border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.02)" }}>
            <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1rem", fontWeight: 700, color: "#ef4444", marginBottom: "1rem" }}>
              Danger Zone
            </h2>
            <p style={{ fontSize: "0.8rem", color: "var(--color-muted)", marginBottom: "1.5rem" }}>
              Destructive operations. These cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <button className="btn btn-secondary" style={{ color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }} onClick={() => toast.error("Action restricted to technical team")}>
                Purge Cancelled Tasks
              </button>
              <button className="btn btn-secondary" style={{ color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }} onClick={() => toast.error("Action restricted to technical team")}>
                Purge Inactive Sessions
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
