"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Upload, User, Globe, PhoneCall, Heart } from "lucide-react";
import Link from "next/link";

const IGAC_ROLES = ["secretary_general", "deputy_sg", "director", "manager", "coordinator", "associate", "observer"];
const MEMBER_STATUSES = ["active", "on_leave", "resigned", "laid_off"];

type Dept = { id: string; name: string };

export default function NewMemberPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [tab, setTab] = useState<"identity" | "family" | "social" | "meta">("identity");

  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", address: "", city: "",
    nationalId: "", igacRole: "associate", departmentId: "",
    memberStatus: "active", activeness: "active", responsiveness: "responsive",
    joiningDate: "", dateOfBirth: "",
    fatherName: "", fatherPhone: "", motherName: "", motherPhone: "",
    emergencyContactName: "", emergencyContactPhone: "",
    facebookUrl: "", instagramUrl: "", linkedinUrl: "", twitterUrl: "",
    notes: "", photoUrl: "",
  });

  useEffect(() => {
    fetch("/api/departments").then(r => r.json()).then(d => setDepartments(d.data ?? []));
  }, []);

  function set(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName || !form.email) { toast.error("Name and email are required"); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        joiningDate: form.joiningDate ? new Date(form.joiningDate) : null,
        dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth) : null,
        departmentId: form.departmentId || null,
      };
      const res = await fetch("/api/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create member");
      toast.success("Member created successfully!");
      router.push(`/members/${json.data.id}`);
    } catch (err: any) {
      toast.error(err.message);
      setLoading(false);
    }
  }

  const TABS = [
    { key: "identity", label: "Identity", icon: User },
    { key: "family", label: "Family & Emergency", icon: Heart },
    { key: "social", label: "Social Links", icon: Globe },
    { key: "meta", label: "Status & Notes", icon: PhoneCall },
  ];

  function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <label style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 500 }}>
          {label}{required && <span style={{ color: "#ef4444" }}> *</span>}
        </label>
        {children}
      </div>
    );
  }

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "800px" }}>
      <Link href="/members" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "#64748b", textDecoration: "none", fontSize: "0.875rem" }}>
        <ArrowLeft size={16} /> Back to Members
      </Link>

      <div>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.5rem", fontWeight: 700, color: "#f1f5f9" }}>
          Onboard New Member
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.8rem", marginTop: "0.2rem" }}>Admin-managed — fill in member details below.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Tab selector */}
        <div style={{ display: "flex", gap: "0.25rem", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "0" }}>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key as any)}
              style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                padding: "0.6rem 1rem", background: "none", border: "none",
                borderBottom: tab === key ? "2px solid #c9a84c" : "2px solid transparent",
                color: tab === key ? "#c9a84c" : "#64748b",
                fontSize: "0.8rem", fontWeight: tab === key ? 600 : 400,
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        <div className="card" style={{ padding: "1.5rem" }}>
          {/* Identity Tab */}
          {tab === "identity" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Field label="Full Name" required>
                <input className="input" value={form.fullName} onChange={e => set("fullName", e.target.value)} placeholder="Ahmed Al-Rashid" />
              </Field>
              <Field label="Email Address" required>
                <input type="email" className="input" value={form.email} onChange={e => set("email", e.target.value)} placeholder="ahmed@igac.info" />
              </Field>
              <Field label="Phone Number">
                <input className="input" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+880 1700 000000" />
              </Field>
              <Field label="National ID / NID">
                <input className="input" value={form.nationalId} onChange={e => set("nationalId", e.target.value)} />
              </Field>
              <Field label="Date of Birth">
                <input type="date" className="input" value={form.dateOfBirth} onChange={e => set("dateOfBirth", e.target.value)} />
              </Field>
              <Field label="Joining Date">
                <input type="date" className="input" value={form.joiningDate} onChange={e => set("joiningDate", e.target.value)} />
              </Field>
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
              <Field label="Address">
                <input className="input" value={form.address} onChange={e => set("address", e.target.value)} placeholder="123 Main Street" />
              </Field>
              <Field label="City">
                <input className="input" value={form.city} onChange={e => set("city", e.target.value)} placeholder="Dhaka" />
              </Field>
            </div>
          )}

          {/* Family Tab */}
          {tab === "family" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Field label="Father's Name">
                <input className="input" value={form.fatherName} onChange={e => set("fatherName", e.target.value)} />
              </Field>
              <Field label="Father's Phone">
                <input className="input" value={form.fatherPhone} onChange={e => set("fatherPhone", e.target.value)} />
              </Field>
              <Field label="Mother's Name">
                <input className="input" value={form.motherName} onChange={e => set("motherName", e.target.value)} />
              </Field>
              <Field label="Mother's Phone">
                <input className="input" value={form.motherPhone} onChange={e => set("motherPhone", e.target.value)} />
              </Field>
              <Field label="Emergency Contact Name">
                <input className="input" value={form.emergencyContactName} onChange={e => set("emergencyContactName", e.target.value)} />
              </Field>
              <Field label="Emergency Contact Phone">
                <input className="input" value={form.emergencyContactPhone} onChange={e => set("emergencyContactPhone", e.target.value)} />
              </Field>
            </div>
          )}

          {/* Social Tab */}
          {tab === "social" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Field label="Facebook Profile URL">
                <input className="input" value={form.facebookUrl} onChange={e => set("facebookUrl", e.target.value)} placeholder="https://facebook.com/..." />
              </Field>
              <Field label="Instagram Profile URL">
                <input className="input" value={form.instagramUrl} onChange={e => set("instagramUrl", e.target.value)} placeholder="https://instagram.com/..." />
              </Field>
              <Field label="LinkedIn Profile URL">
                <input className="input" value={form.linkedinUrl} onChange={e => set("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/..." />
              </Field>
              <Field label="Twitter / X Profile URL">
                <input className="input" value={form.twitterUrl} onChange={e => set("twitterUrl", e.target.value)} placeholder="https://twitter.com/..." />
              </Field>
            </div>
          )}

          {/* Status & Notes Tab */}
          {tab === "meta" && (
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
              <Field label="Internal Notes">
                <textarea className="input" value={form.notes} onChange={e => set("notes", e.target.value)}
                  rows={5} placeholder="Private notes visible only to admins…"
                  style={{ resize: "vertical" }} />
              </Field>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <Link href="/members">
            <button type="button" className="btn btn-secondary">Cancel</button>
          </Link>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Creating…" : "Create Member"}
          </button>
        </div>
      </form>
    </div>
  );
}
