"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { toast } from "sonner";
import { Eye, EyeOff, Globe, Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signIn.email({ email, password });
      if (error) {
        toast.error(error.message || "Invalid credentials");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="animate-in">
      {/* Logo / Brand */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: "56px", height: "56px", borderRadius: "14px",
          background: "linear-gradient(135deg, #c9a84c, #d4b86a)",
          marginBottom: "1rem", boxShadow: "0 0 32px rgba(201,168,76,0.3)",
        }}>
          <Globe size={28} color="#0a1628" strokeWidth={2.5} />
        </div>
        <h1 style={{
          fontFamily: "var(--font-playfair)", fontSize: "1.75rem",
          fontWeight: 700, color: "#f1f5f9", marginBottom: "0.25rem",
        }}>
          IGAC HR Portal
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
          International Global Affairs Council
        </p>
      </div>

      {/* Card */}
      <div className="glass" style={{ borderRadius: "16px", padding: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <Shield size={16} color="#c9a84c" />
          <span style={{ fontSize: "0.75rem", color: "#94a3b8", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 600 }}>
            Authorised Access Only
          </span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.4rem", fontWeight: 500 }}>
              Email Address
            </label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@igac.info"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.4rem", fontWeight: 500 }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={{ paddingRight: "2.5rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: "0.5rem", justifyContent: "center", padding: "0.65rem 1rem", fontSize: "0.9rem" }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p style={{ textAlign: "center", marginTop: "2rem", fontSize: "0.75rem", color: "#334155" }}>
        Developed by{" "}
        <a href="https://noeticstudio.net" target="_blank" rel="noopener noreferrer"
          style={{ color: "#c9a84c", textDecoration: "none", fontWeight: 600 }}>
          NOÉTIC Studio
        </a>
      </p>
    </div>
  );
}
