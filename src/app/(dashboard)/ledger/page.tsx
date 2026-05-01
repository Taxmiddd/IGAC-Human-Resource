"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { BookOpen, Search, X, Download, Filter } from "lucide-react";
import { formatBDT, formatDate } from "@/lib/utils";
import Link from "next/link";
import type { FinancialLedger, Member } from "@/lib/db/schema";

type LedgerRow = FinancialLedger & { member?: Pick<Member, "fullName" | "employeeId" | "photoUrl"> | null };

const TX_COLORS: Record<string, string> = {
  event_payment: "#3b82f6", stipend: "#22c55e", allowance: "#f59e0b",
  bonus: "#a855f7", deduction: "#ef4444", reimbursement: "#06b6d4", advance: "#f97316",
};

export default function LedgerPage() {
  const [data, setData] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  
  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const LIMIT = 30;

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (typeFilter) params.append("type", typeFilter);
    // Simple client-side search filtering logic handled after fetch for simplicity in this demo, 
    // ideally search should be server-side. For this demo, we'll fetch all matching type and filter by name.
    
    // To support real search, we need a member name filter on the API, but let's filter the fetched rows for now.
    const res = await fetch(`/api/financial/ledger?${params}`);
    const json = await res.json();
    
    let rows = json.data ?? [];
    if (debouncedSearch) {
      rows = rows.filter((r: LedgerRow) => r.member?.fullName.toLowerCase().includes(debouncedSearch.toLowerCase()));
    }
    
    setData(rows);
    setTotal(json.total ?? 0);
    setLoading(false);
  }, [page, typeFilter, debouncedSearch]);

  useEffect(() => { fetch_(); }, [fetch_]);

  function exportCsv() {
    const params = new URLSearchParams();
    if (typeFilter) params.append("type", typeFilter);
    window.open(`/api/financial/ledger/export?${params}`, "_blank");
  }

  // Calculate totals from current view
  const totalAllotted = data.reduce((s, r) => s + r.allotted, 0);
  const totalDisbursed = data.reduce((s, r) => s + r.disbursed, 0);
  const totalBalance = totalAllotted - totalDisbursed;

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.5rem", fontWeight: 700, color: "var(--color-foreground)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <BookOpen size={22} color="var(--color-primary)" />
            Financial Ledger
          </h1>
          <p style={{ color: "var(--color-muted)", fontSize: "0.8rem", marginTop: "0.2rem" }}>
            Central record of all member financial transactions.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={exportCsv} style={{ fontSize: "0.85rem", gap: "0.4rem" }}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Summary Totals Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
        {[
          { label: "Page Allotted", value: formatBDT(totalAllotted), color: "#3b82f6" },
          { label: "Page Disbursed", value: formatBDT(totalDisbursed), color: "#22c55e" },
          { label: "Page Balance", value: formatBDT(totalBalance), color: totalBalance >= 0 ? "#22c55e" : "#ef4444" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ padding: "1rem", borderColor: `${color}20` }}>
            <div style={{ fontSize: "0.7rem", color: "var(--color-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.4rem" }}>{label}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: "0.875rem 1rem", display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.03)", padding: "0.25rem 0.5rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", flex: "1 1 200px" }}>
          <Search size={14} color="var(--color-muted)" />
          <input
            style={{ background: "transparent", border: "none", color: "var(--color-foreground)", fontSize: "0.8rem", outline: "none", width: "100%" }}
            placeholder="Search member name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "var(--color-muted)", cursor: "pointer" }}><X size={12} /></button>}
        </div>

        <select className="input" style={{ width: "auto" }} value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
          <option value="">All Types</option>
          {["event_payment","stipend","allowance","bonus","deduction","reimbursement","advance"].map(t => <option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
        </select>

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
                <th>Purpose</th>
                <th>Allotted</th>
                <th>Disbursed</th>
                <th>Balance</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j}><div className="skeleton" style={{ height: "16px", width: "80%" }} /></td>)}</tr>
                ))
              ) : data.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "var(--color-muted)" }}>No transactions found</td></tr>
              ) : (
                data.map(row => (
                  <tr key={row.id}>
                    <td>
                      <Link href={`/members/${row.memberId}`} style={{ display: "flex", alignItems: "center", gap: "0.6rem", textDecoration: "none" }}>
                        <div style={{ width: "24px", height: "24px", borderRadius: "50%", flexShrink: 0, background: "var(--color-forest-800)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", color: "var(--color-primary)", fontWeight: 700 }}>
                          {row.member?.fullName[0] ?? "?"}
                        </div>
                        <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "var(--color-foreground)" }}>{row.member?.fullName}</div>
                      </Link>
                    </td>
                    <td>
                      <span className="badge" style={{ background: `${TX_COLORS[row.transactionType]}18`, color: TX_COLORS[row.transactionType] }}>
                        {row.transactionType.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td style={{ maxWidth: "200px" }}>
                      <div style={{ fontSize: "0.8rem", color: "var(--color-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.purpose}</div>
                      {row.eventName && <div style={{ fontSize: "0.7rem", color: "var(--color-muted-foreground)" }}>{row.eventName}</div>}
                    </td>
                    <td style={{ fontWeight: 600, color: "#3b82f6", fontSize: "0.85rem" }}>{formatBDT(row.allotted)}</td>
                    <td style={{ fontWeight: 600, color: "#22c55e", fontSize: "0.85rem" }}>{formatBDT(row.disbursed)}</td>
                    <td style={{ fontWeight: 700, fontSize: "0.85rem", color: row.allotted >= row.disbursed ? "#22c55e" : "#ef4444" }}>
                      {formatBDT(row.allotted - row.disbursed)}
                    </td>
                    <td style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>{formatDate(row.recordedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", borderTop: "1px solid var(--color-border-subtle)", fontSize: "0.8rem", color: "var(--color-muted)" }}>
          <span>Showing {Math.min((page - 1) * LIMIT + 1, total)}–{Math.min(page * LIMIT, total)} of {total}</span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-secondary" style={{ padding: "0.35rem 0.75rem", fontSize: "0.78rem" }} disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <button className="btn btn-secondary" style={{ padding: "0.35rem 0.75rem", fontSize: "0.78rem" }} disabled={page * LIMIT >= total} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
