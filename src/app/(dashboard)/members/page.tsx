"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, flexRender,
  type ColumnDef, type SortingState,
} from "@tanstack/react-table";
import { toast } from "sonner";
import {
  Search, Plus, Upload, ChevronUp, ChevronDown,
  ArrowUpDown, Eye, MoreHorizontal, Filter,
} from "lucide-react";
import type { Member } from "@/lib/db/schema";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

type MemberWithDept = Member & { department?: { name: string } | null };

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  active:    { bg: "rgba(34,197,94,0.12)",  color: "#22c55e" },
  on_leave:  { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" },
  resigned:  { bg: "rgba(100,116,139,0.12)",color: "#64748b" },
  laid_off:  { bg: "rgba(239,68,68,0.12)",  color: "#ef4444" },
  inactive:  { bg: "rgba(148,163,184,0.12)",color: "#94a3b8" },
  unresponsive: { bg: "rgba(249,115,22,0.12)", color: "#f97316" },
  responsive: { bg: "rgba(34,197,94,0.1)",  color: "#4ade80" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { bg: "rgba(100,116,139,0.12)", color: "#94a3b8" };
  return (
    <span className="badge" style={{ background: s.bg, color: s.color }}>
      {status.replace("_", " ")}
    </span>
  );
}

export default function MembersPage() {
  const router = useRouter();
  const [data, setData] = useState<MemberWithDept[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activenessFilter, setActivenessFilter] = useState("");
  const [responsivenessFilter, setResponsivenessFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 25;

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page), limit: String(LIMIT),
      ...(globalFilter && { search: globalFilter }),
      ...(statusFilter && { status: statusFilter }),
      ...(activenessFilter && { activeness: activenessFilter }),
      ...(responsivenessFilter && { responsiveness: responsivenessFilter }),
    });
    const res = await fetch(`/api/members?${params}`);
    const json = await res.json();
    setData(json.data ?? []);
    setTotal(json.total ?? 0);
    setLoading(false);
  }, [page, globalFilter, statusFilter, activenessFilter, responsivenessFilter]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const columns: ColumnDef<MemberWithDept>[] = [
    {
      id: "member",
      header: "Member",
      accessorFn: (r) => r.fullName,
      cell: ({ row }) => (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: "34px", height: "34px", borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #162d55, #2d5299)",
            backgroundImage: row.original.photoUrl ? `url(${row.original.photoUrl})` : undefined,
            backgroundSize: "cover", backgroundPosition: "center",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.75rem", fontWeight: 700, color: "#c9a84c",
          }}>
            {!row.original.photoUrl && row.original.fullName[0]}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "#f1f5f9", fontSize: "0.875rem" }}>{row.original.fullName}</div>
            <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{row.original.employeeId}</div>
          </div>
        </div>
      ),
    },
    { accessorKey: "email", header: "Email", cell: ({ getValue }) => <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{getValue() as string}</span> },
    { id: "dept", header: "Department", accessorFn: (r) => r.department?.name ?? "—", cell: ({ getValue }) => <span style={{ fontSize: "0.8rem" }}>{getValue() as string}</span> },
    {
      accessorKey: "igacRole", header: "IGAC Role",
      cell: ({ getValue }) => <span style={{ fontSize: "0.78rem", color: "#94a3b8", textTransform: "capitalize" }}>{(getValue() as string).replace("_", " ")}</span>,
    },
    {
      accessorKey: "memberStatus", header: "Status",
      cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
    },
    {
      accessorKey: "activeness", header: "Activeness",
      cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
    },
    {
      accessorKey: "responsiveness", header: "Responsiveness",
      cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
    },
    {
      accessorKey: "joiningDate", header: "Joined",
      cell: ({ getValue }) => <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{formatDate(getValue() as Date)}</span>,
    },
    {
      id: "actions", header: "",
      cell: ({ row }) => (
        <Link href={`/members/${row.original.id}`} style={{ textDecoration: "none" }}>
          <button className="btn btn-ghost" style={{ padding: "0.3rem 0.6rem", fontSize: "0.78rem" }}>
            <Eye size={14} /> View
          </button>
        </Link>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(total / LIMIT),
  });

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.5rem", fontWeight: 700, color: "#f1f5f9" }}>
            Member Directory
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.8rem", marginTop: "0.2rem" }}>
            {total} members total
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link href="/members/import">
            <button className="btn btn-secondary" style={{ fontSize: "0.8rem" }}>
              <Upload size={15} /> Import CSV
            </button>
          </Link>
          <Link href="/members/new">
            <button className="btn btn-primary" style={{ fontSize: "0.8rem" }}>
              <Plus size={15} /> Add Member
            </button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: "1rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <Search size={15} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
          <input
            className="input"
            placeholder="Search name or email…"
            value={globalFilter}
            onChange={(e) => { setGlobalFilter(e.target.value); setPage(1); }}
            style={{ paddingLeft: "2.25rem" }}
          />
        </div>
        <select className="input" style={{ width: "auto", flex: "0 0 auto" }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="on_leave">On Leave</option>
          <option value="resigned">Resigned</option>
          <option value="laid_off">Laid Off</option>
        </select>
        <select className="input" style={{ width: "auto", flex: "0 0 auto" }} value={activenessFilter} onChange={(e) => { setActivenessFilter(e.target.value); setPage(1); }}>
          <option value="">Activeness</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select className="input" style={{ width: "auto", flex: "0 0 auto" }} value={responsivenessFilter} onChange={(e) => { setResponsivenessFilter(e.target.value); setPage(1); }}>
          <option value="">Responsiveness</option>
          <option value="responsive">Responsive</option>
          <option value="unresponsive">Unresponsive</option>
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      style={{ cursor: header.column.getCanSort() ? "pointer" : "default" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === "asc" ? <ChevronUp size={12} /> :
                         header.column.getIsSorted() === "desc" ? <ChevronDown size={12} /> :
                         header.column.getCanSort() ? <ArrowUpDown size={12} style={{ opacity: 0.3 }} /> : null}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: "18px", width: "80%" }} /></td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                    No members found
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "0.75rem 1rem", borderTop: "1px solid rgba(255,255,255,0.06)",
          fontSize: "0.8rem", color: "#64748b",
        }}>
          <span>Showing {Math.min((page - 1) * LIMIT + 1, total)}–{Math.min(page * LIMIT, total)} of {total}</span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-secondary" style={{ padding: "0.35rem 0.75rem", fontSize: "0.78rem" }}
              disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              Previous
            </button>
            <button className="btn btn-secondary" style={{ padding: "0.35rem 0.75rem", fontSize: "0.78rem" }}
              disabled={page * LIMIT >= total} onClick={() => setPage(p => p + 1)}>
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
