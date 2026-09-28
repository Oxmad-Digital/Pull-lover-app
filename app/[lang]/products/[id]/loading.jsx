export default function ProductDetailLoading() {
  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px", fontFamily: "var(--font-montserrat), sans-serif" }}>
      <style>{`@keyframes _pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px" }}>
        {/* Images */}
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ width: "72px", height: "88px", background: "#e7e5e4", borderRadius: "8px", animation: `_pulse 1.5s ease-in-out ${i * 0.1}s infinite` }} />
            ))}
          </div>
          <div style={{ flex: 1, paddingBottom: "120%", background: "#e7e5e4", borderRadius: "12px", animation: "_pulse 1.5s ease-in-out infinite" }} />
        </div>

        {/* Infos */}
        <div>
          <div style={{ height: "14px", width: "80px", background: "#e7e5e4", borderRadius: "6px", marginBottom: "16px", animation: "_pulse 1.5s ease-in-out infinite" }} />
          <div style={{ height: "32px", width: "90%", background: "#e7e5e4", borderRadius: "8px", marginBottom: "8px", animation: "_pulse 1.5s ease-in-out 0.1s infinite" }} />
          <div style={{ height: "24px", width: "100px", background: "#e7e5e4", borderRadius: "6px", marginBottom: "32px", animation: "_pulse 1.5s ease-in-out 0.2s infinite" }} />

          <div style={{ height: "14px", width: "60px", background: "#e7e5e4", borderRadius: "6px", marginBottom: "12px", animation: "_pulse 1.5s ease-in-out 0.3s infinite" }} />
          <div style={{ display: "flex", gap: "8px", marginBottom: "32px" }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ height: "44px", width: "52px", background: "#e7e5e4", borderRadius: "8px", animation: `_pulse 1.5s ease-in-out ${i * 0.08}s infinite` }} />
            ))}
          </div>

          <div style={{ height: "52px", background: "#e7e5e4", borderRadius: "10px", animation: "_pulse 1.5s ease-in-out 0.4s infinite" }} />
        </div>
      </div>
    </div>
  );
}
