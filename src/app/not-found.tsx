import Link from "next/link";
import { Globe } from "lucide-react";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: "1rem",
      background: "linear-gradient(135deg, #030712 0%, #0a1628 100%)",
      padding: "2rem",
    }}>
      <div style={{
        width: "56px", height: "56px", borderRadius: "14px",
        background: "linear-gradient(135deg, #c9a84c, #d4b86a)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: "0.5rem",
      }}>
        <Globe size={28} color="#0a1628" />
      </div>
      <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "3rem", fontWeight: 700, color: "#c9a84c" }}>404</h1>
      <p style={{ color: "#94a3b8", fontSize: "1rem" }}>Page not found.</p>
      <Link href="/dashboard" style={{ textDecoration: "none" }}>
        <button className="btn btn-primary" style={{ marginTop: "0.5rem" }}>← Back to Dashboard</button>
      </Link>
      <p style={{ marginTop: "2rem", fontSize: "0.75rem", color: "#334155" }}>
        Developed by{" "}
        <a href="https://noeticstudio.net" target="_blank" rel="noopener noreferrer" style={{ color: "#c9a84c", textDecoration: "none", fontWeight: 600 }}>
          NOÉTIC Studio
        </a>
      </p>
    </div>
  );
}
