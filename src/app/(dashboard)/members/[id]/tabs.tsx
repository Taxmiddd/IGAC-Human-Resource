"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { formatBDT, formatDate } from "@/lib/utils";
import type { FinancialLedger, LeaveRequest, MemberDocument, MemberStatusLog, Member } from "@/lib/db/schema";
import { Plus, X, Check, Trash2, Upload, FileText, ExternalLink } from "lucide-react";

type LeaveRow = LeaveRequest & { approver?: { name: string } | null };
type LedgerRow = FinancialLedger & { recorder?: { name: string } | null };
type DocRow = MemberDocument;
type LogRow = MemberStatusLog;

const LEAVE_COLORS: Record<string, { bg: string; color: string }> = {
  pending:  { bg: "rgba(245,158,11,0.12)",  color: "#f59e0b" },
  approved: { bg: "rgba(34,197,94,0.12)",   color: "#22c55e" },
  rejected: { bg: "rgba(239,68,68,0.12)",   color: "#ef4444" },
};

const TX_COLORS: Record<string, string> = {
  event_payment: "#3b82f6", stipend: "#22c55e", allowance: "#f59e0b",
  bonus: "#a855f7", deduction: "#ef4444", reimbursement: "#06b6d4", advance: "#f97316",
};

const DOC_ICONS: Record<string, string> = {
  id_card: "🪪", contract: "📄", nda: "🔒", certificate: "🏅", other: "📁",
};

export function FinancialTab({ memberId, isAdmin }: { memberId: string; isAdmin: boolean }) {
  const [data, setData] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ transactionType: "event_payment", purpose: "", eventName: "", allottedTaka: "", disbursedTaka: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/financial/ledger?memberId=${memberId}&limit=100`);
    const json = await res.json();
    setData(json.data ?? []);
    setLoading(false);
  }, [memberId]);

  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/financial/ledger", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, ...form, allottedTaka: Number(form.allottedTaka || 0), disbursedTaka: Number(form.disbursedTaka || 0) }),
    });
    if (!res.ok) { toast.error("Failed to record"); setSaving(false); return; }
    toast.success("Transaction recorded"); setShowForm(false); load();
    setForm({ transactionType: "event_payment", purpose: "", eventName: "", allottedTaka: "", disbursedTaka: "", notes: "" });
    setSaving(false);
  }

  const totalAllotted = data.reduce((s, r) => s + r.allotted, 0);
  const totalDisbursed = data.reduce((s, r) => s + r.disbursed, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
        {[
          { label: "Total Allotted", value: formatBDT(totalAllotted), color: "#3b82f6" },
          { label: "Total Disbursed", value: formatBDT(totalDisbursed), color: "#22c55e" },
          { label: "Balance", value: formatBDT(totalAllotted - totalDisbursed), color: totalAllotted >= totalDisbursed ? "#22c55e" : "#ef4444" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ padding: "0.875rem" }}>
            <div style={{ fontSize: "0.65rem", color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.3rem" }}>{label}</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>
      {isAdmin && (
        <button className="btn btn-primary" style={{ alignSelf: "flex-start", fontSize: "0.82rem" }} onClick={() => setShowForm(v => !v)}>
          <Plus size={14} /> {showForm ? "Cancel" : "Add Transaction"}
        </button>
      )}
      {showForm && (
        <form onSubmit={submit} className="card" style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ fontSize: "0.72rem", color: "var(--color-muted-foreground)", display: "block", marginBottom: "0.25rem" }}>Type</label>
              <select className="input" value={form.transactionType} onChange={e => setForm(p => ({ ...p, transactionType: e.target.value }))}>
                {["event_payment","stipend","allowance","bonus","deduction","reimbursement","advance"].map(t => <option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.72rem", color: "var(--color-muted-foreground)", display: "block", marginBottom: "0.25rem" }}>Event (optional)</label>
              <input className="input" value={form.eventName} onChange={e => setForm(p => ({ ...p, eventName: e.target.value }))} placeholder="MUN Dhaka 2025" />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ fontSize: "0.72rem", color: "var(--color-muted-foreground)", display: "block", marginBottom: "0.25rem" }}>Purpose *</label>
              <input className="input" required value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))} placeholder="What was this for?" />
            </div>
            <div>
              <label style={{ fontSize: "0.72rem", color: "var(--color-muted-foreground)", display: "block", marginBottom: "0.25rem" }}>Allotted (৳)</label>
              <input type="number" min="0" step="0.01" className="input" value={form.allottedTaka} onChange={e => setForm(p => ({ ...p, allottedTaka: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: "0.72rem", color: "var(--color-muted-foreground)", display: "block", marginBottom: "0.25rem" }}>Disbursed (৳)</label>
              <input type="number" min="0" step="0.01" className="input" value={form.disbursedTaka} onChange={e => setForm(p => ({ ...p, disbursedTaka: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Record"}</button>
          </div>
        </form>
      )}
      <div className="card" style={{ overflow: "hidden" }}>
        <table className="data-table">
          <thead><tr><th>Type</th><th>Purpose</th><th>Allotted</th><th>Disbursed</th><th>Balance</th><th>Date</th><th>By</th></tr></thead>
          <tbody>
            {loading ? Array.from({length:4}).map((_,i)=><tr key={i}>{Array.from({length:7}).map((_,j)=><td key={j}><div className="skeleton" style={{height:"14px",width:"80%"}}/></td>)}</tr>) :
             data.length === 0 ? <tr><td colSpan={7} style={{textAlign:"center",padding:"2rem",color:"var(--color-muted)"}}>No transactions yet</td></tr> :
             data.map(r => (
              <tr key={r.id}>
                <td><span className="badge" style={{background:`${TX_COLORS[r.transactionType]}18`,color:TX_COLORS[r.transactionType]}}>{r.transactionType.replace(/_/g," ")}</span></td>
                <td style={{fontSize:"0.78rem",maxWidth:"160px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.purpose}</td>
                <td style={{fontWeight:600,color:"#3b82f6",fontSize:"0.82rem"}}>{formatBDT(r.allotted)}</td>
                <td style={{fontWeight:600,color:"#22c55e",fontSize:"0.82rem"}}>{formatBDT(r.disbursed)}</td>
                <td style={{fontWeight:700,fontSize:"0.82rem",color:r.allotted>=r.disbursed?"#22c55e":"#ef4444"}}>{formatBDT(r.allotted-r.disbursed)}</td>
                <td style={{fontSize:"0.75rem",color:"var(--color-muted)"}}>{formatDate(r.recordedAt)}</td>
                <td style={{fontSize:"0.75rem",color:"var(--color-muted)"}}>{r.recorder?.name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function LeavesTab({ memberId, isAdmin }: { memberId: string; isAdmin: boolean }) {
  const [data, setData] = useState<LeaveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "sick", startDate: "", endDate: "", reason: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/leaves?memberId=${memberId}&limit=100`);
    const json = await res.json();
    setData(json.data ?? []);
    setLoading(false);
  }, [memberId]);

  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/leaves", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, ...form }),
    });
    if (!res.ok) { toast.error("Failed to submit"); setSaving(false); return; }
    toast.success("Leave submitted"); setShowForm(false); load();
    setForm({ type: "sick", startDate: "", endDate: "", reason: "" });
    setSaving(false);
  }

  async function handleAction(id: string, status: "approved" | "rejected") {
    await fetch(`/api/leaves/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    toast.success(`Leave ${status}`); load();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <button className="btn btn-primary" style={{ alignSelf: "flex-start", fontSize: "0.82rem" }} onClick={() => setShowForm(v => !v)}>
        <Plus size={14} /> {showForm ? "Cancel" : "Submit Leave"}
      </button>
      {showForm && (
        <form onSubmit={submit} className="card" style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ fontSize: "0.72rem", color: "var(--color-muted-foreground)", display: "block", marginBottom: "0.25rem" }}>Type</label>
              <select className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {["sick","vacation","unpaid","maternity","paternity","other"].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.72rem", color: "var(--color-muted-foreground)", display: "block", marginBottom: "0.25rem" }}>Start Date</label>
              <input type="date" className="input" required value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: "0.72rem", color: "var(--color-muted-foreground)", display: "block", marginBottom: "0.25rem" }}>End Date</label>
              <input type="date" className="input" required value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ fontSize: "0.72rem", color: "var(--color-muted-foreground)", display: "block", marginBottom: "0.25rem" }}>Reason *</label>
              <textarea className="input" rows={2} required value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} style={{ resize: "vertical" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Submitting…" : "Submit"}</button>
          </div>
        </form>
      )}
      <div className="card" style={{ overflow: "hidden" }}>
        <table className="data-table">
          <thead><tr><th>Type</th><th>Period</th><th>Days</th><th>Reason</th><th>Status</th><th>By</th>{isAdmin && <th>Actions</th>}</tr></thead>
          <tbody>
            {loading ? Array.from({length:3}).map((_,i)=><tr key={i}>{Array.from({length:6}).map((_,j)=><td key={j}><div className="skeleton" style={{height:"14px",width:"80%"}}/></td>)}</tr>) :
             data.length === 0 ? <tr><td colSpan={isAdmin?7:6} style={{textAlign:"center",padding:"2rem",color:"var(--color-muted)"}}>No leave requests</td></tr> :
             data.map(r => {
              const days = Math.ceil((new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / 86400000) + 1;
              const s = LEAVE_COLORS[r.status];
              return (
                <tr key={r.id}>
                  <td><span className="badge" style={{background:"rgba(32,201,151,0.1)",color:"var(--color-primary)"}}>{r.type}</span></td>
                  <td style={{fontSize:"0.78rem",color:"var(--color-muted-foreground)"}}>{formatDate(r.startDate)} — {formatDate(r.endDate)}</td>
                  <td style={{fontWeight:700,fontSize:"0.82rem"}}>{days}d</td>
                  <td style={{fontSize:"0.78rem",maxWidth:"150px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.reason}</td>
                  <td><span className="badge" style={{background:s.bg,color:s.color}}>{r.status}</span></td>
                  <td style={{fontSize:"0.75rem",color:"var(--color-muted)"}}>{r.approver?.name ?? "—"}</td>
                  {isAdmin && r.status === "pending" && (
                    <td>
                      <div style={{display:"flex",gap:"0.3rem"}}>
                        <button className="btn btn-ghost" style={{padding:"0.2rem 0.5rem",fontSize:"0.7rem",color:"#22c55e",border:"1px solid rgba(34,197,94,0.3)"}} onClick={()=>handleAction(r.id,"approved")}><Check size={11}/></button>
                        <button className="btn btn-ghost" style={{padding:"0.2rem 0.5rem",fontSize:"0.7rem",color:"#ef4444",border:"1px solid rgba(239,68,68,0.3)"}} onClick={()=>handleAction(r.id,"rejected")}><X size={11}/></button>
                      </div>
                    </td>
                  )}
                  {isAdmin && r.status !== "pending" && <td />}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DocumentsTab({ memberId }: { memberId: string }) {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ documentType: "id_card", name: "", url: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/documents?memberId=${memberId}`);
    const json = await res.json();
    setDocs(json.data ?? []);
    setLoading(false);
  }, [memberId]);

  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.url) { toast.error("Name and URL required"); return; }
    setSaving(true);
    const res = await fetch("/api/documents", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, ...form }),
    });
    if (!res.ok) { toast.error("Failed"); setSaving(false); return; }
    toast.success("Document added"); setShowForm(false); load();
    setForm({ documentType: "id_card", name: "", url: "" });
    setSaving(false);
  }

  async function deleteDoc(id: string) {
    if (!confirm("Delete this document?")) return;
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    toast.success("Deleted"); load();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <button className="btn btn-primary" style={{ alignSelf: "flex-start", fontSize: "0.82rem" }} onClick={() => setShowForm(v => !v)}>
        <Upload size={14} /> {showForm ? "Cancel" : "Add Document"}
      </button>
      {showForm && (
        <form onSubmit={submit} className="card" style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ fontSize: "0.72rem", color: "var(--color-muted-foreground)", display: "block", marginBottom: "0.25rem" }}>Document Type</label>
              <select className="input" value={form.documentType} onChange={e => setForm(p => ({ ...p, documentType: e.target.value }))}>
                {["id_card","contract","nda","certificate","other"].map(t => <option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.72rem", color: "var(--color-muted-foreground)", display: "block", marginBottom: "0.25rem" }}>Name *</label>
              <input className="input" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="National ID Card" />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ fontSize: "0.72rem", color: "var(--color-muted-foreground)", display: "block", marginBottom: "0.25rem" }}>File URL *</label>
              <input className="input" required value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://utfs.io/f/..." />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Add"}</button>
          </div>
        </form>
      )}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: "0.75rem" }}>
          {Array.from({length:4}).map((_,i) => <div key={i} className="skeleton" style={{height:"100px",borderRadius:"10px"}} />)}
        </div>
      ) : docs.length === 0 ? (
        <div className="card" style={{ padding: "2rem", textAlign: "center", color: "var(--color-muted)" }}>
          <FileText size={32} style={{ margin: "0 auto 0.5rem", opacity: 0.3 }} />
          <p style={{ fontSize: "0.85rem" }}>No documents uploaded yet</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: "0.75rem" }}>
          {docs.map(doc => (
            <div key={doc.id} className="card" style={{ padding: "1rem", position: "relative" }}>
              <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>{DOC_ICONS[doc.documentType] ?? "📁"}</div>
              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--color-foreground)", marginBottom: "0.2rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--color-muted)", marginBottom: "0.75rem", textTransform: "capitalize" }}>{doc.documentType.replace(/_/g," ")}</div>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ padding: "0.25rem 0.5rem", fontSize: "0.72rem", flex: 1, justifyContent: "center" }}>
                  <ExternalLink size={12} /> View
                </a>
                <button className="btn btn-ghost" style={{ padding: "0.25rem 0.5rem", color: "#ef4444" }} onClick={() => deleteDoc(doc.id)}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ActivityTab({ statusLogs }: { statusLogs: LogRow[] }) {
  if (statusLogs.length === 0) {
    return (
      <div className="card" style={{ padding: "2rem", textAlign: "center", color: "var(--color-muted)" }}>
        <p style={{ fontSize: "0.85rem" }}>No status changes recorded yet</p>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      {statusLogs.map((log, i) => (
        <div key={log.id} style={{
          display: "flex", gap: "1rem", paddingBottom: "1rem",
          borderLeft: i < statusLogs.length - 1 ? "2px solid var(--color-border-subtle)" : "2px solid transparent",
          marginLeft: "0.75rem", paddingLeft: "1.25rem", position: "relative",
        }}>
          <div style={{
            position: "absolute", left: "-5px", top: "0",
            width: "10px", height: "10px", borderRadius: "50%",
            background: "var(--color-primary)", border: "2px solid var(--color-surface)",
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.2rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--color-foreground)", textTransform: "capitalize" }}>
                {log.field.replace(/([A-Z])/g, " $1")} changed
              </span>
              <span style={{ fontSize: "0.72rem", color: "#ef4444", background: "rgba(239,68,68,0.1)", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>{log.oldValue}</span>
              <span style={{ fontSize: "0.72rem", color: "var(--color-muted)" }}>→</span>
              <span style={{ fontSize: "0.72rem", color: "#22c55e", background: "rgba(34,197,94,0.1)", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>{log.newValue}</span>
            </div>
            {log.reason && <p style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginBottom: "0.2rem" }}>{log.reason}</p>}
            <span style={{ fontSize: "0.7rem", color: "var(--color-muted)" }}>{formatDate(log.changedAt)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
