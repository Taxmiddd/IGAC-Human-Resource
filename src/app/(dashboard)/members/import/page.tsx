"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Upload, Download, ArrowLeft, CheckCircle, XCircle, FileText } from "lucide-react";
import Link from "next/link";

// Dynamic import for papaparse (client-side CSV parsing)
let Papa: any;
if (typeof window !== "undefined") {
  import("papaparse").then(m => { Papa = m.default; });
}

const CSV_TEMPLATE = `full_name,email,phone,igac_role,member_status,activeness,responsiveness,address,city,father_name,father_phone,mother_name,mother_phone,facebook_url,instagram_url,notes
Ahmed Al-Rashid,ahmed@igac.info,+880 1700 000001,coordinator,active,active,responsive,123 Main St,Dhaka,Mr. Al-Rashid,+880 1700 000002,Mrs. Al-Rashid,+880 1700 000003,https://facebook.com/ahmed,,Member since founding`;

type ImportResult = { inserted: number; errors: { row: number; error: string }[]; success: boolean };

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (!Papa) { toast.error("CSV parser not loaded, try again"); return; }
      const parsed = Papa.parse(ev.target?.result as string, { header: true, skipEmptyLines: true });
      setPreview((parsed.data as Record<string, string>[]).slice(0, 5));
    };
    reader.readAsText(f);
  }

  async function handleImport() {
    if (!file || !Papa) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const parsed = Papa.parse(ev.target?.result as string, { header: true, skipEmptyLines: true });
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsed.data }),
      });
      const json: ImportResult = await res.json();
      setResult(json);
      setLoading(false);
      if (json.success) toast.success(`Imported ${json.inserted} members successfully!`);
      else toast.error(`Imported ${json.inserted} with ${json.errors.length} errors`);
    };
    reader.readAsText(file);
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "igac_members_template.csv"; a.click();
  }

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "760px" }}>
      <Link href="/members" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "#64748b", textDecoration: "none", fontSize: "0.875rem" }}>
        <ArrowLeft size={16} /> Back to Members
      </Link>

      <div>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.5rem", fontWeight: 700, color: "#f1f5f9" }}>
          Import Members from Spreadsheet
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.8rem", marginTop: "0.2rem" }}>
          Upload a CSV file to bulk-create members. Download the template to see the required columns.
        </p>
      </div>

      {/* Template download */}
      <div className="card" style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <FileText size={20} color="#c9a84c" />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#f1f5f9" }}>CSV Template</div>
          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Download and fill in your members data</div>
        </div>
        <button className="btn btn-secondary" onClick={downloadTemplate}>
          <Download size={15} /> Download Template
        </button>
      </div>

      {/* File upload */}
      <div className="card" style={{ padding: "1.5rem" }}>
        <h2 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#f1f5f9", marginBottom: "1rem" }}>Upload CSV File</h2>
        <label style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: "0.75rem", padding: "2rem", border: "2px dashed rgba(201,168,76,0.25)",
          borderRadius: "10px", cursor: "pointer", transition: "border-color 0.2s",
          background: "rgba(201,168,76,0.03)",
        }}
          onDragOver={e => e.preventDefault()}
        >
          <Upload size={28} color="#c9a84c" />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 600, color: "#f1f5f9", fontSize: "0.9rem" }}>
              {file ? file.name : "Click to select or drag & drop CSV"}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
              {file ? `${(file.size / 1024).toFixed(1)} KB` : "Supports .csv files exported from Excel/Google Sheets"}
            </div>
          </div>
          <input type="file" accept=".csv" onChange={handleFile} style={{ display: "none" }} />
        </label>
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="card" style={{ padding: "1rem", overflow: "hidden" }}>
          <h2 style={{ fontSize: "0.8rem", fontWeight: 600, color: "#94a3b8", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Preview (first 5 rows)
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  {Object.keys(preview[0]).slice(0, 8).map(k => <th key={k}>{k}</th>)}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).slice(0, 8).map((v, j) => (
                      <td key={j} style={{ fontSize: "0.78rem", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v || "—"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-primary" onClick={handleImport} disabled={loading}>
              <Upload size={15} /> {loading ? "Importing…" : `Import All Rows`}
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            {result.success
              ? <CheckCircle size={20} color="#22c55e" />
              : <XCircle size={20} color="#f59e0b" />}
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#f1f5f9" }}>
              {result.inserted} members imported {result.errors.length > 0 ? `(${result.errors.length} errors)` : "successfully!"}
            </h2>
          </div>
          {result.errors.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {result.errors.map(({ row, error }) => (
                <div key={row} style={{ fontSize: "0.8rem", color: "#ef4444", display: "flex", gap: "0.5rem" }}>
                  <span style={{ color: "#64748b" }}>Row {row}:</span> {error}
                </div>
              ))}
            </div>
          )}
          {result.success && (
            <Link href="/members">
              <button className="btn btn-primary" style={{ marginTop: "0.75rem" }}>View Members →</button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
