"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Save, User, Heart, Globe, Activity } from "lucide-react";
import Link from "next/link";
import type { Member } from "@/lib/db/schema";

const IGAC_ROLES = ["secretary_general","deputy_sg","director","manager","coordinator","associate","observer"];
const MEMBER_STATUSES = ["active","on_leave","resigned","laid_off"];
type Dept = { id: string; name: string };
type Tab = "identity" | "family" | "social" | "status";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <label style={{ fontSize: "0.78rem", color: "var(--color-muted-foreground)", fontWeight: 500 }}>
        {label}{required && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

export default function EditMemberPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [tab, setTab] = useState<Tab>("identity");
  const [statusReason, setStatusReason] = useState("");
  const [originalStatus, setOriginalStatus] = useState("");

  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", address: "", city: "",
    nationalId: "", igacRole: "associate", departmentId: "",
    memberStatus: "active", activeness: "active", responsiveness: "responsive",
    joiningDate: "", dateOfBirth: "", resignationDate: "",
    fatherName: "", fatherPhone: "", motherName: "", motherPhone: "",
    emergencyContactName: "", emergencyContactPhone: "",
    facebookUrl: "", instagramUrl: "", linkedinUrl: "", twitterUrl: "",
    notes: "", photoUrl: "",
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/members/${id}`).then(r => r.json()),
      fetch("/api/departments").then(r => r.json()),
    ]).then(([memberData, deptData]) => {
      const m: Member = memberData.data;
      setDepartments(deptData.data ?? []);
      setOriginalStatus(m.memberStatus);
      setForm({
        fullName: m.fullName ?? "",
        email: m.email ?? "",
        phone: m.phone ?? "",
        address: m.address ?? "",
        city: m.city ?? "",
        nationalId: m.nationalId ?? "",
        igacRole: m.igacRole ?? "associate",
        departmentId: m.departmentId ?? "",
        memberStatus: m.memberStatus ?? "active",
        activeness: m.activeness ?? "active",
        responsiveness: m.responsiveness ?? "responsive",
        joiningDate: m.joiningDate ? new Date(m.joiningDate).toISOString().split("T")[0] : "",
        dateOfBirth: m.dateOfBirth ? new Date(m.dateOfBirth).toISOString().split("T")[0] : "",
        resignationDate: m.resignationDate ? new Date(m.resignationDate).toISOString().split("T")[0] : "",
        fatherName: m.fatherName ?? "",
        fatherPhone: m.fatherPhone ?? "",
        motherName: m.motherName ?? "",
        motherPhone: m.motherPhone ?? "",
        emergencyContactName: m.emergencyContactName ?? "",
        emergencyContactPhone: m.emergencyContactPhone ?? "",
        facebookUrl: m.facebookUrl ?? "",
        instagramUrl: m.instagramUrl ?? "",
        linkedinUrl: m.linkedinUrl ?? "",
        twitterUrl: m.twitterUrl ?? "",
        notes: m.notes ?? "",
        photoUrl: m.photoUrl ?? "",
      });
      setFetching(false);
    });
  }, [id]);

  function set(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName || !form.email) { toast.error("Name and email are required"); return; }
    setLoading(true);

    const statusChanged = form.memberStatus !== originalStatus ||
      form.activeness !== (form.activeness) || form.responsiveness !== (form.responsiveness);

    try {
      const payload = {
        ...form,
        joiningDate: form.joiningDate ? new Date(form.joiningDate) : null,
        dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth) : null,
        resignationDate: form.resignationDate ? new Date(form.resignationDate) : null,
        departmentId: form.departmentId || null,
        _statusReason: statusChanged && statusReason ? statusReason : undefined,
      };
      const res = await fetch(`/api/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update member");
      toast.success("Member updated successfully!");
      router.push(`/members/${id}`);
    } catch (err: any) {
      toast.error(err.message);
      setLoading(false);
    }
  }

  const TABS = [
    { key: "identity" as Tab, label: "Identity", icon: User },
    { key: "family"   as Tab, label: "Family & Emergency", icon: Heart },
    { key: "social"   as Tab, label: "Social Links", icon: Globe },
    { key: "status"   as Tab, label: "Status & Notes", icon: Activity },
  ];

  if (fetching) {
    return (
      <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: "40px", borderRadius: "8px" }} />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "800px" }}>
      <Link href={`/members/${id}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--color-muted)", textDecoration: "none", fontSize: "0.875rem" }}>
        <ArrowLeft size={16} /> Back to Profile
      </Link>

      <div>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.5rem", fontWeight: 700, color: "var(--color-foreground)" }}>
          Edit Member
        </h1>
        <p style={{ color: "var(--color-muted)", fontSize: "0.8rem", marginTop: "0.2rem" }}>
          Changes will be saved immediately. Status changes are logged.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.25rem", borderBottom: "1px solid var(--color-border-subtle)" }}>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                padding: "0.6rem 1rem", background: "none", border: "none",
                borderBottom: tab === key ? "2px solid var(--color-primary)" : "2px solid transparent",
                color: tab === key ? "var(--color-primary)" : "var(--color-muted)",
                fontSize: "0.8rem", fontWeight: tab === key ? 600 : 400,
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        <div className="card" style={{ padding: "1.5rem" }}>
          {/* Identity */}
          {tab === "identity" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Field label="Full Name" required><input className="input" value={form.fullName} onChange={e => set("fullName", e.target.value)} /></Field>
              <Field label="Email Address" required><input type="email" className="input" value={form.email} onChange={e => set("email", e.target.value)} /></Field>
              <Field label="Phone"><input className="input" value={form.phone} onChange={e => set("phone", e.target.value)} /></Field>
              <Field label="National ID"><input className="input" value={form.nationalId} onChange={e => set("nationalId", e.target.value)} /></Field>
              <Field label="Date of Birth"><input type="date" className="input" value={form.dateOfBirth} onChange={e => set("dateOfBirth", e.target.value)} /></Field>
              <Field label="Joining Date"><input type="date" className="input" value={form.joiningDate} onChange={e => set("joiningDate", e.target.value)} /></Field>
              <Field label="IGAC Role">
                <select className="input" value={form.igacRole} onChange={e => set("igacRole", e.target.value)}>
                  {IGAC_ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
                </select>
              </Field>
              <Field label="Department">
                <select className="input" value={form.departmentId} onChange={e => set("departmentId", e.target.value)}>
                  <option value="">— No Department —</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </Field>
              <Field label="Address"><input className="input" value={form.address} onChange={e => set("address", e.target.value)} /></Field>
              <Field label="City"><input className="input" value={form.city} onChange={e => set("city", e.target.value)} /></Field>
              <Field label="Photo URL"><input className="input" value={form.photoUrl} onChange={e => set("photoUrl", e.target.value)} placeholder="https://..." /></Field>
            </div>
          )}

          {/* Family */}
          {tab === "family" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Field label="Father's Name"><input className="input" value={form.fatherName} onChange={e => set("fatherName", e.target.value)} /></Field>
              <Field label="Father's Phone"><input className="input" value={form.fatherPhone} onChange={e => set("fatherPhone", e.target.value)} /></Field>
              <Field label="Mother's Name"><input className="input" value={form.motherName} onChange={e => set("motherName", e.target.value)} /></Field>
              <Field label="Mother's Phone"><input className="input" value={form.motherPhone} onChange={e => set("motherPhone", e.target.value)} /></Field>
              <Field label="Emergency Contact Name"><input className="input" value={form.emergencyContactName} onChange={e => set("emergencyContactName", e.target.value)} /></Field>
              <Field label="Emergency Contact Phone"><input className="input" value={form.emergencyContactPhone} onChange={e => set("emergencyContactPhone", e.target.value)} /></Field>
            </div>
          )}

          {/* Social */}
          {tab === "social" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Field label="Facebook URL"><input className="input" value={form.facebookUrl} onChange={e => set("facebookUrl", e.target.value)} placeholder="https://facebook.com/..." /></Field>
              <Field label="Instagram URL"><input className="input" value={form.instagramUrl} onChange={e => set("instagramUrl", e.target.value)} placeholder="https://instagram.com/..." /></Field>
              <Field label="LinkedIn URL"><input className="input" value={form.linkedinUrl} onChange={e => set("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/..." /></Field>
              <Field label="Twitter / X URL"><input className="input" value={form.twitterUrl} onChange={e => set("twitterUrl", e.target.value)} placeholder="https://twitter.com/..." /></Field>
            </div>
          )}

          {/* Status */}
          {tab === "status" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                <Field label="Member Status">
                  <select className="input" value={form.memberStatus} onChange={e => set("memberStatus", e.target.value)}>
                    {MEMBER_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                  </select>
                </Field>
                <Field label="Activeness">
                  <select className="input" value={form.activeness} onChange={e => set("activeness", e.target.value)}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </Field>
                <Field label="Responsiveness">
                  <select className="input" value={form.responsiveness} onChange={e => set("responsiveness", e.target.value)}>
                    <option value="responsive">Responsive</option>
                    <option value="unresponsive">Unresponsive</option>
                  </select>
                </Field>
              </div>
              {(form.memberStatus === "resigned" || form.memberStatus === "laid_off") && (
                <Field label="Resignation / End Date">
                  <input type="date" className="input" value={form.resignationDate} onChange={e => set("resignationDate", e.target.value)} />
                </Field>
              )}
              <Field label="Reason for Status Change (optional)">
                <input className="input" value={statusReason} onChange={e => setStatusReason(e.target.value)} placeholder="e.g. Medical leave approved by Secretary General" />
              </Field>
              <Field label="Internal Notes">
                <textarea className="input" rows={5} value={form.notes} onChange={e => set("notes", e.target.value)}
                  placeholder="Private notes visible only to admins…" style={{ resize: "vertical" }} />
              </Field>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <Link href={`/members/${id}`}>
            <button type="button" className="btn btn-secondary">Cancel</button>
          </Link>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ gap: "0.5rem" }}>
            <Save size={15} />
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
