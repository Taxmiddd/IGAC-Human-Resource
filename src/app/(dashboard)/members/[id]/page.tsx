import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { members, financialLedger } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { formatDate, formatBDT } from "@/lib/utils";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Hash, Building2, Edit } from "lucide-react";
import Link from "next/link";
import { MemberProfileClient } from "./profile-client";

type Params = { params: Promise<{ id: string }> };

async function getMember(id: string) {
  return db.query.members.findFirst({
    where: eq(members.id, id),
    with: {
      department: true,
      statusLogs: { orderBy: (l, { desc }) => [desc(l.changedAt)], limit: 50 },
      tasks: { orderBy: (t, { desc }) => [desc(t.createdAt)], limit: 20 },
    },
  });
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  active:       { bg: "rgba(34,197,94,0.12)",   color: "#22c55e" },
  on_leave:     { bg: "rgba(245,158,11,0.12)",   color: "#f59e0b" },
  resigned:     { bg: "rgba(100,116,139,0.12)",  color: "#64748b" },
  laid_off:     { bg: "rgba(239,68,68,0.12)",    color: "#ef4444" },
  inactive:     { bg: "rgba(148,163,184,0.12)",  color: "#94a3b8" },
  unresponsive: { bg: "rgba(249,115,22,0.12)",   color: "#f97316" },
  responsive:   { bg: "rgba(34,197,94,0.1)",     color: "#4ade80" },
};

function Badge({ value }: { value: string }) {
  const s = STATUS_COLORS[value] ?? { bg: "rgba(100,116,139,0.12)", color: "#94a3b8" };
  return <span className="badge" style={{ background: s.bg, color: s.color }}>{value.replace(/_/g, " ")}</span>;
}

function InfoRow({ label, value, icon: Icon }: { label: string; value?: string | null; icon?: React.ElementType }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
      <span style={{ fontSize: "0.68rem", color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
        {Icon && <Icon size={11} />}{label}
      </span>
      <span style={{ fontSize: "0.875rem", color: "var(--color-foreground)" }}>{value}</span>
    </div>
  );
}

export default async function MemberProfilePage({ params }: Params) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const isAdmin = session?.user?.role === "core_admin";

  const member = await getMember(id);
  if (!member) notFound();

  let financialSummary = null;
  if (isAdmin) {
    const fin = await db.select({
      totalAllotted: sql<number>`sum(allotted)`,
      totalDisbursed: sql<number>`sum(disbursed)`,
      count: sql<number>`count(*)`,
    }).from(financialLedger).where(eq(financialLedger.memberId, id));
    financialSummary = fin[0];
  }

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Back nav */}
      <Link href="/members" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--color-muted)", textDecoration: "none", fontSize: "0.875rem" }}>
        <ArrowLeft size={16} /> Back to Members
      </Link>

      {/* Profile Header */}
      <div className="card" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* Avatar */}
          <div style={{
            width: "88px", height: "88px", borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, var(--color-forest-800), var(--color-forest-600))",
            backgroundImage: member.photoUrl ? `url(${member.photoUrl})` : undefined,
            backgroundSize: "cover", backgroundPosition: "center",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2rem", fontWeight: 700, color: "var(--color-primary)",
            border: "3px solid rgba(32,201,151,0.2)",
            boxShadow: "0 0 24px rgba(32,201,151,0.1)",
          }}>
            {!member.photoUrl && member.fullName[0]}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.4rem" }}>
              <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.5rem", fontWeight: 700, color: "var(--color-foreground)" }}>
                {member.fullName}
              </h1>
              {member.employeeId && (
                <span style={{ fontSize: "0.72rem", color: "var(--color-muted)", background: "rgba(255,255,255,0.05)", padding: "0.2rem 0.6rem", borderRadius: "6px", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <Hash size={10} />{member.employeeId}
                </span>
              )}
            </div>
            <p style={{ color: "var(--color-muted-foreground)", fontSize: "0.875rem", textTransform: "capitalize", marginBottom: "0.75rem" }}>
              {member.igacRole.replace(/_/g, " ")}
              {member.department ? ` · ${member.department.name}` : ""}
            </p>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
              <Badge value={member.memberStatus} />
              <Badge value={member.activeness} />
              <Badge value={member.responsiveness} />
            </div>
            <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
              {member.email && <span style={{ fontSize: "0.78rem", color: "var(--color-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}><Mail size={12} />{member.email}</span>}
              {member.phone && <span style={{ fontSize: "0.78rem", color: "var(--color-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}><Phone size={12} />{member.phone}</span>}
              {member.city && <span style={{ fontSize: "0.78rem", color: "var(--color-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}><MapPin size={12} />{member.city}</span>}
              {member.joiningDate && <span style={{ fontSize: "0.78rem", color: "var(--color-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}><Calendar size={12} />Joined {formatDate(member.joiningDate)}</span>}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
            <Link href={`/members/${id}/edit`}>
              <button className="btn btn-primary" style={{ fontSize: "0.82rem" }}>
                <Edit size={14} /> Edit
              </button>
            </Link>
          </div>
        </div>

        {/* Financial quick view — admin only */}
        {isAdmin && financialSummary && (
          <div style={{
            marginTop: "1.25rem", paddingTop: "1.25rem",
            borderTop: "1px solid var(--color-border-subtle)",
            display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem",
          }}>
            {[
              { label: "Total Allotted", value: formatBDT(financialSummary.totalAllotted ?? 0), color: "#3b82f6" },
              { label: "Total Disbursed", value: formatBDT(financialSummary.totalDisbursed ?? 0), color: "#22c55e" },
              { label: "Transactions", value: String(financialSummary.count ?? 0), color: "var(--color-foreground)" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div style={{ fontSize: "0.65rem", color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.2rem" }}>{label}</div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color }}>{value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabbed content (client) */}
      <MemberProfileClient
        memberId={id}
        isAdmin={isAdmin}
        member={{
          address: member.address,
          city: member.city,
          dateOfBirth: member.dateOfBirth ? member.dateOfBirth.toISOString() : null,
          nationalId: member.nationalId,
          fatherName: member.fatherName,
          fatherPhone: member.fatherPhone,
          motherName: member.motherName,
          motherPhone: member.motherPhone,
          emergencyContactName: member.emergencyContactName,
          emergencyContactPhone: member.emergencyContactPhone,
          facebookUrl: member.facebookUrl,
          instagramUrl: member.instagramUrl,
          linkedinUrl: member.linkedinUrl,
          twitterUrl: member.twitterUrl,
          notes: member.notes,
        }}
        statusLogs={member.statusLogs.map(l => ({
          ...l,
          changedAt: l.changedAt ? l.changedAt.toISOString() : null,
        }))}
      />
    </div>
  );
}
