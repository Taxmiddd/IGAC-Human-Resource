"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Shield, Key, User, CheckCircle2 } from "lucide-react";

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const invitationId = searchParams.get("id");

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!invitationId) {
      toast.error("Invalid invitation link");
      setChecking(false);
      return;
    }

    async function checkInvite() {
      try {
        // Better Auth client doesn't have a direct "getInvitation" without a session usually
        // but we can try to accept it with dummy data to check or use a custom API.
        // Actually, let's just let the user try to submit.
        setChecking(false);
      } catch (e) {
        setChecking(false);
      }
    }
    checkInvite();
  }, [invitationId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!invitationId) return;
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/admin/invite/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: invitationId, name, password }),
    });

    const json = await res.json();

    if (!res.ok) {
      toast.error(json.error || "Failed to accept invitation");
      setLoading(false);
      return;
    }

    toast.success("Account created successfully!");
    router.push("/dashboard");
  }

  if (checking) return <div className="flex items-center justify-center min-h-screen">Checking invitation...</div>;

  return (
    <div className="card" style={{ maxWidth: "400px", margin: "4rem auto", padding: "2rem" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ 
          width: "60px", height: "60px", background: "rgba(184, 158, 101, 0.1)", 
          borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 1rem auto"
        }}>
          <Shield size={30} color="var(--color-primary)" />
        </div>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", color: "var(--color-foreground)" }}>
          Join IGAC Portal
        </h1>
        <p style={{ color: "var(--color-muted)", fontSize: "0.875rem", marginTop: "0.5rem" }}>
          Complete your account setup to get started.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--color-muted)", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <User size={14} /> Full Name
          </label>
          <input 
            className="input" 
            placeholder="e.g. John Doe" 
            required 
            value={name} 
            onChange={e => setName(e.target.value)} 
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--color-muted)", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Key size={14} /> Password
          </label>
          <input 
            className="input" 
            type="password" 
            placeholder="••••••••" 
            required 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--color-muted)", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <CheckCircle2 size={14} /> Confirm Password
          </label>
          <input 
            className="input" 
            type="password" 
            placeholder="••••••••" 
            required 
            value={confirmPassword} 
            onChange={e => setConfirmPassword(e.target.value)} 
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading} 
          style={{ marginTop: "1rem", height: "45px" }}
        >
          {loading ? "Setting up..." : "Complete Setup"}
        </button>
      </form>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <AcceptInvitationContent />
    </Suspense>
  );
}
