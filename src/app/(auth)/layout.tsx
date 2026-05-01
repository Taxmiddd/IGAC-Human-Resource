export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #030712 0%, #0a1628 50%, #030712 100%)" }}>
      {/* Decorative orbs */}
      <div style={{
        position: "absolute", top: "-20%", right: "-10%",
        width: "600px", height: "600px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-20%", left: "-10%",
        width: "500px", height: "500px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(22,45,85,0.5) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "440px", padding: "1.5rem" }}>
        {children}
      </div>
    </div>
  );
}
