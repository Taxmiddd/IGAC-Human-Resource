"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { CalendarDays, Check, X, Plus, Clock, ChevronDown } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { LeaveRequest, Member } from "@/lib/db/schema";

type LeaveRow = LeaveRequest & {
  member?: Pick<Member, "fullName" | "employeeId" | "photoUrl"> | null;
  approver?: { name: string } | null;
};

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending:  { bg: "rgba(245,158,11,0.12)",  color: "#f59e0b",  label: "Pending"  },
  approved: { bg: "rgba(34,197,94,0.12)",   color: "#22c55e",  label: "Approved" },
  rejected: { bg: "rgba(239,68,68,0.12)",   color: "#ef4444",  label: "Rejected" },
};

const TYPE_LABEL: Record<string, string> = {
  sick: "Sick", vacation: "Vacation", unpaid: "Unpaid",
  maternity: "Maternity", paternity: "Paternity", other: "Other",
};

function AddLeaveModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [members, setMembers] = useState<Pick<Member, "id" | "fullName" | "employeeId">[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ memberId: "", type: "sick", startDate: "", endDate: "", reason: "" });

  useEffect(() => {
    fetch("/api/members?limit=300").then(r => r.json()).then(d => setMembers(d.data ?? []));
  }, []);

  function set(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.memberId || !form.startDate || !form.endDate || !form.reason) {
      toast.error("All fields are required"); return;
    }
    setLoading(true);
    const res = await fetch("/api/leaves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) { toast.error("Failed to submit"); setLoading(false); return; }
    toast.success("Leave request submitted");
    onSuccess(); onClose();
  }

  return (
    <div className="overlay" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div className="glass" style={{ borderRadius: "16px", padding: "1.5rem", width: "100%", maxWidth: "480px" }}>
        <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.2rem", fontWeight: 700, color: "var(--color-foreground)", marginBottom: "1.25rem" }}>
          New Leave Request
        </h2>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div>
            <label style={{ fontSize: "0.75rem", color: "var(--color-muted-foreground)", display: "block", marginBottom: "0.3rem" }}>Member *</label>
            <select className="input" value={form.memberId} onChange={e => set("memberId", e.target.value)} required>
              <option value="">Select member…</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.fullName} ({m.employeeId})</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--color-muted-foreground)", display: "block", marginBottom: "0.3rem" }}>Type *</label>
              <select className="input" value={form.type} onChange={e => set("type", e.target.value)}>
                {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div />
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--color-muted-foreground)", display: "block", marginBottom: "0.3rem" }}>Start Date *</label>
              <input type="date" className="input" value={form.startDate} onChange={e => set("startDate", e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--color-muted-foreground)", display: "block", marginBottom: "0.3rem" }}>End Date *</label>
              <input type="date" className="input" value={form.endDate} onChange={e => set("endDate", e.target.value)} required />
            </div>
          </div>
          <div>
            <label style={{ fontSize: "0.75rem", color: "var(--color-muted-foreground)", display: "block", marginBottom: "0.3rem" }}>Reason *</label>
            <textarea className="input" rows={3} value={form.reason} onChange={e => set("reason", e.target.value)} style={{ resize: "vertical" }} required />
          </div>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Submitting…" : "Submit Request"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LeavesPage() {
  const [data, setData] = useState<LeaveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const LIMIT = 25;

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT), ...(statusFilter && { status: statusFilter }) });
    const res = await fetch(`/api/leaves?${params}`);
    const json = await res.json();
    setData(json.data ?? []);
    setTotal(json.total ?? 0);
    setPendingCount(json.pendingCount ?? 0);
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { fetch_(); }, [fetch_]);

  async function handleAction(id: string, status: "approved" | "rejected") {
    const res = await fetch(`/api/leaves/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) { toast.error("Failed to update"); return; }
    toast.success(`Leave ${status}`);
    fetch_();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this leave request?")) return;
    await fetch(`/api/leaves/${id}`, { method: "DELETE" });
    toast.success("Deleted");
    fetch_();
  }

  function daysBetween(start: Date, end: Date) {
    return Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {showModal && <AddLeaveModal onClose={() => setShowModal(false)} onSuccess={fetch_} />}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.5rem", fontWeight: 700, color: "var(--color-foreground)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <CalendarDays size={22} color="var(--color-primary)" />
            Leave Management
          </h1>
          <p style={{ color: "var(--color-muted)", fontSize: "0.8rem", marginTop: "0.2rem" }}>
            {total} requests · <span style={{ color: "#f59e0b", fontWeight: 600 }}>{pendingCount} pending</span>
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ fontSize: "0.85rem" }}>
          <Plus size={15} /> New Request
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
        {[
          { label: "Pending", count: pendingCount, color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
          { label: "Approved", count: data.filter(r => r.status === "approved").length, color: "#22c55e", bg: "rgba(34,197,94,0.08)" },
          { label: "Rejected", count: data.filter(r => r.status === "rejected").length, color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className="card" style={{ padding: "1rem", background: bg, borderColor: `${color}20`, cursor: "pointer" }}
            onClick={() => setStatusFilter(label.toLowerCase())}>
            <div style={{ fontSize: "0.7rem", color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.4rem" }}>{label}</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color }}>{count}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="card" style={{ padding: "0.875rem 1rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <select className="input" style={{ width: "auto" }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        {statusFilter && (
          <button className="btn btn-ghost" style={{ fontSize: "0.78rem" }} onClick={() => setStatusFilter("")}>
            <X size={13} /> Clear
          </button>
        )}
        <span style={{ marginLeft: "auto", fontSize: "0.78rem", color: "var(--color-muted)" }}>
          {total} results
        </span>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Type</th>
                <th>Period</th>
                <th>Duration</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Reviewed By</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: "16px", width: "80%" }} /></td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "var(--color-muted)" }}>
                    No leave requests found
                  </td>
                </tr>
              ) : (
                data.map(row => {
                  const s = STATUS_STYLE[row.status] ?? STATUS_STYLE.pending;
                  const days = daysBetween(row.startDate, row.endDate);
                  return (
                    <tr key={row.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <div style={{
                            width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0,
                            background: "linear-gradient(135deg, var(--color-forest-800), var(--color-forest-600))",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.65rem", fontWeight: 700, color: "var(--color-primary)",
                          }}>
                            {row.member?.fullName?.[0] ?? "?"}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--color-foreground)" }}>{row.member?.fullName}</div>
                            <div style={{ fontSize: "0.7rem", color: "var(--color-muted)" }}>{row.member?.employeeId}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: "rgba(32,201,151,0.1)", color: "var(--color-primary)" }}>
                          {TYPE_LABEL[row.type] ?? row.type}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.8rem", color: "var(--color-muted-foreground)" }}>
                        {formatDate(row.startDate)} — {formatDate(row.endDate)}
                      </td>
                      <td>
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-foreground)" }}>
                          {days}d
                        </span>
                      </td>
                      <td style={{ maxWidth: "200px" }}>
                        <span style={{ fontSize: "0.78rem", color: "var(--color-muted-foreground)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {row.reason}
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                      </td>
                      <td style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>
                        {row.approver?.name ?? "—"}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
                          {row.status === "pending" && (
                            <>
                              <button
                                className="btn btn-ghost"
                                style={{ padding: "0.25rem 0.6rem", fontSize: "0.72rem", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}
                                onClick={() => handleAction(row.id, "approved")}
                                title="Approve"
                              >
                                <Check size={13} /> Approve
                              </button>
                              <button
                                className="btn btn-ghost"
                                style={{ padding: "0.25rem 0.6rem", fontSize: "0.72rem", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}
                                onClick={() => handleAction(row.id, "rejected")}
                                title="Reject"
                              >
                                <X size={13} /> Reject
                              </button>
                            </>
                          )}
                          <button
                            className="btn btn-ghost"
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.72rem", color: "var(--color-muted)" }}
                            onClick={() => handleDelete(row.id)}
                            title="Delete"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "0.75rem 1rem", borderTop: "1px solid var(--color-border-subtle)",
          fontSize: "0.8rem", color: "var(--color-muted)",
        }}>
          <span>Showing {Math.min((page - 1) * LIMIT + 1, total)}–{Math.min(page * LIMIT, total)} of {total}</span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-secondary" style={{ padding: "0.35rem 0.75rem", fontSize: "0.78rem" }}
              disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <button className="btn btn-secondary" style={{ padding: "0.35rem 0.75rem", fontSize: "0.78rem" }}
              disabled={page * LIMIT >= total} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
