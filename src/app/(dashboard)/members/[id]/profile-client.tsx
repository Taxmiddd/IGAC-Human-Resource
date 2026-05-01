"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { FinancialTab, LeavesTab, DocumentsTab, ActivityTab } from "./tabs";
import { User, BookOpen, CalendarDays, FileText, Activity, Globe } from "lucide-react";

type StatusLog = {
  id: string;
  field: string;
  oldValue: string | null;
  newValue: string;
  reason: string | null;
  changedAt: string | null;
};

type MemberInfo = {
  address?: string | null;
  city?: string | null;
  dateOfBirth?: string | null;
  nationalId?: string | null;
  fatherName?: string | null;
  fatherPhone?: string | null;
  motherName?: string | null;
  motherPhone?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  notes?: string | null;
};

type Props = {
  memberId: string;
  isAdmin: boolean;
  member: MemberInfo;
  statusLogs: StatusLog[];
};

const TABS = [
  { key: "overview",   label: "Overview",   icon: User },
  { key: "financial",  label: "Financial",  icon: BookOpen },
  { key: "leaves",     label: "Leaves",     icon: CalendarDays },
  { key: "documents",  label: "Documents",  icon: FileText },
  { key: "activity",   label: "Activity",   icon: Activity },
];

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
      <span style={{ fontSize: "0.68rem", color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: "0.875rem", color: "var(--color-foreground)" }}>{value}</span>
    </div>
  );
}

export function MemberProfileClient({ memberId, isAdmin, member, statusLogs }: Props) {
  const [tab, setTab] = useState("overview");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Tab bar */}
      <div style={{ display: "flex", gap: "0", borderBottom: "1px solid var(--color-border-subtle)", overflowX: "auto" }}>
        {TABS.filter(t => isAdmin || t.key !== "financial").map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              display: "flex", alignItems: "center", gap: "0.45rem",
              padding: "0.65rem 1.1rem", background: "none", border: "none",
              borderBottom: tab === key ? "2px solid var(--color-primary)" : "2px solid transparent",
              color: tab === key ? "var(--color-primary)" : "var(--color-muted)",
              fontSize: "0.82rem", fontWeight: tab === key ? 600 : 400,
              cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
            }}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {/* Contact */}
          <div className="card" style={{ padding: "1.25rem" }}>
            <h2 style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>
              Contact Information
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <InfoRow label="Address" value={member.address} />
              <InfoRow label="City" value={member.city} />
              <InfoRow label="Date of Birth" value={member.dateOfBirth ? formatDate(new Date(member.dateOfBirth)) : null} />
              <InfoRow label="National ID" value={member.nationalId} />
            </div>
          </div>

          {/* Family */}
          <div className="card" style={{ padding: "1.25rem" }}>
            <h2 style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>
              Family & Emergency
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <InfoRow label="Father's Name" value={member.fatherName} />
              <InfoRow label="Father's Phone" value={member.fatherPhone} />
              <InfoRow label="Mother's Name" value={member.motherName} />
              <InfoRow label="Mother's Phone" value={member.motherPhone} />
              <InfoRow label="Emergency Contact" value={member.emergencyContactName} />
              <InfoRow label="Emergency Phone" value={member.emergencyContactPhone} />
            </div>
          </div>

          {/* Social */}
          {(member.facebookUrl || member.instagramUrl || member.linkedinUrl || member.twitterUrl) && (
            <div className="card" style={{ padding: "1.25rem" }}>
              <h2 style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>
                Social Links
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {member.facebookUrl && (
                  <a href={member.facebookUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "#3b82f6", textDecoration: "none", fontSize: "0.875rem" }}>
                    <Globe size={15} /> Facebook
                  </a>
                )}
                {member.instagramUrl && (
                  <a href={member.instagramUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "#ec4899", textDecoration: "none", fontSize: "0.875rem" }}>
                    <Globe size={15} /> Instagram
                  </a>
                )}
                {member.linkedinUrl && (
                  <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "#0ea5e9", textDecoration: "none", fontSize: "0.875rem" }}>
                    <Globe size={15} /> LinkedIn
                  </a>
                )}
                {member.twitterUrl && (
                  <a href={member.twitterUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "#38bdf8", textDecoration: "none", fontSize: "0.875rem" }}>
                    <Globe size={15} /> Twitter / X
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {member.notes && (
            <div className="card" style={{ padding: "1.25rem" }}>
              <h2 style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
                Internal Notes
              </h2>
              <p style={{ fontSize: "0.875rem", color: "var(--color-muted-foreground)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{member.notes}</p>
            </div>
          )}
        </div>
      )}

      {tab === "financial" && isAdmin && <FinancialTab memberId={memberId} isAdmin={isAdmin} />}
      {tab === "leaves" && <LeavesTab memberId={memberId} isAdmin={isAdmin} />}
      {tab === "documents" && <DocumentsTab memberId={memberId} />}
      {tab === "activity" && (
        <ActivityTab statusLogs={statusLogs.map(l => ({
          ...l,
          memberId: memberId,
          changedBy: null,
          changedAt: l.changedAt ? new Date(l.changedAt) : null,
        }))} />
      )}
    </div>
  );
}
