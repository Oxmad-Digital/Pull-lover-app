"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const P = {
  bg:     "#f5f5f4",
  card:   "#fff",
  border: "#e7e5e4",
  text:   "#252323",
  muted:  "#a8a29e",
  accent: "#C75C5C",
  font:   "var(--font-montserrat), 'Montserrat', sans-serif",
};

export default function AddCategoryPage() {
  const [name, setName]   = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const res  = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) { const data = await res.json(); setError(data.message); return; }
    router.push("/admin/categories");
  };

  return (
    <div style={{ minHeight: "100vh", background: P.bg, padding: "28px 36px", fontFamily: P.font }}>

      {/* Topbar */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
        <Link href="/admin/categories" style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "7px 14px", background: P.card, color: "#57534e",
          border: `1.5px solid ${P.border}`, borderRadius: "8px",
          fontSize: "13px", fontWeight: "600", fontFamily: P.font,
          textDecoration: "none", transition: "all 0.15s",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = P.text; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = P.text; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = P.card; e.currentTarget.style.color = "#57534e"; e.currentTarget.style.borderColor = P.border; }}
        >
          � Catégories
        </Link>
        <h1 style={{ fontSize: "26px", fontWeight: "700", color: P.text, letterSpacing: "-0.5px", margin: 0 }}>
          Nouvelle catégorie
        </h1>
      </div>

      {/* Formulaire */}
      <div style={{ maxWidth: "420px", background: P.card, border: `1px solid ${P.border}`, borderRadius: "12px", padding: "28px" }}>
        {error && (
          <div style={{ padding: "10px 14px", background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "8px", color: "#be123c", fontSize: "13px", fontWeight: "500", marginBottom: "18px", fontFamily: P.font }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: P.muted, marginBottom: "8px", fontFamily: P.font }}>
              Nom de la catégorie
            </label>
            <input
              autoFocus
              type="text"
              placeholder="Ex : Pulls, Cardigans…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%", padding: "9px 13px", border: `1.5px solid ${P.border}`,
                borderRadius: "8px", fontSize: "14px", fontFamily: P.font,
                color: P.text, background: "#fafaf9", outline: "none",
                boxSizing: "border-box", transition: "border-color 0.2s",
              }}
              onFocus={(e)  => { e.target.style.borderColor = P.accent; e.target.style.background = P.card; }}
              onBlur={(e)   => { e.target.style.borderColor = P.border; e.target.style.background = "#fafaf9"; }}
            />
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit" style={{
              flex: 1, padding: "10px 0", background: P.accent, color: "#fff",
              border: "none", borderRadius: "9px", fontSize: "13px",
              fontWeight: "700", fontFamily: P.font, cursor: "pointer",
              transition: "background 0.2s",
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#b04d4d"}
              onMouseLeave={(e) => e.currentTarget.style.background = P.accent}
            >
              Créer la catégorie
            </button>
            <Link href="/admin/categories" style={{
              padding: "10px 18px", background: "#f5f5f4", color: "#78716c",
              border: `1.5px solid ${P.border}`, borderRadius: "9px",
              fontSize: "13px", fontWeight: "600", fontFamily: P.font,
              textDecoration: "none", display: "flex", alignItems: "center",
              transition: "all 0.15s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = P.text; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#f5f5f4"; e.currentTarget.style.color = "#78716c"; }}
            >
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
