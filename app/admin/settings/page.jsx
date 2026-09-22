"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/app/hooks/useToast";
import { Toast } from "@/app/components/ui/Toast";
import "../customers/customers.css";

const labelStyle = {
  display: "block", fontSize: 11, fontWeight: 700, color: "#78716c",
  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em",
};

const inputStyle = {
  width: "100%", padding: "9px 12px", border: "1.5px solid #e7e5e4",
  borderRadius: 6, fontSize: 13, fontFamily: "inherit", color: "#0f172a",
  outline: "none", boxSizing: "border-box", background: "#fff",
};

const cardStyle = {
  background: "#fff", border: "1px solid #e7e5e4", borderRadius: 10,
  padding: "20px 24px",
};

function toLocalDatetimeValue(date) {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function StatusBadge({ active, activeLabel, inactiveLabel }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
      background: active ? "#dcfce7" : "#fee2e2",
      color: active ? "#15803d" : "#b91c1c",
    }}>
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

export default function AdminSettingsPage() {
  const [dropDate, setDropDate]       = useState("");
  const [bandeauText, setBandeauText] = useState("");
  const [badgeText, setBadgeText]     = useState("");
  const [current, setCurrent]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(null);
  const [errors, setErrors]           = useState({});
  const { toast, showToast }          = useToast();

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res  = await fetch("/api/admin/settings");
    const data = await res.json();
    setCurrent(data);
    setDropDate(toLocalDatetimeValue(data.dropDate));
    setBandeauText(data.bandeauText ?? "");
    setBadgeText(data.badgeText ?? "");
    setLoading(false);
  }

  function toggleMaintenance() {
    patch("maintenanceMode", !current?.maintenanceMode, "Mode maintenance");
  }

  async function patch(field, value, label) {
    setSaving(field);
    setErrors((e) => ({ ...e, [field]: "" }));
    const res  = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    const data = await res.json();
    setSaving(null);
    if (!res.ok) {
      setErrors((e) => ({ ...e, [field]: data.error || "Erreur" }));
    } else {
      setCurrent(data);
      showToast(`${label} mis à jour`);
    }
  }

  const dropExpired = current?.dropDate && new Date(current.dropDate) < new Date();

  if (loading) {
    return (
      <div className="ap-page">
        <div className="ap-topbar"><h1 className="ap-topbar-title">Gestion du contenu</h1></div>
        <div className="admin-loading-wrap"><span className="admin-loader" />Chargement</div>
      </div>
    );
  }

  return (
    <div className="ap-page">
      <Toast toast={toast} />

      <style>{`
        .content-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 860px) {
          .content-grid {
            grid-template-columns: 1fr;
          }
        }
        .ap-toggle {
          position: relative;
          width: 36px;
          height: 20px;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.2s;
        }
        .ap-toggle.on  { background: #C95D5D; }
        .ap-toggle.off { background: #d4d4d0; }
        .ap-toggle-thumb {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 14px;
          height: 14px;
          border-radius: var(--radius-full);
          background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.18);
          transition: left 0.2s;
        }
        .ap-toggle.on .ap-toggle-thumb { left: 19px; }
      `}</style>

      <div className="ap-topbar">
        <h1 className="ap-topbar-title">Gestion du contenu</h1>
      </div>

      <div className="content-grid">

        {/* ── Compteur drop ── */}
        <div style={cardStyle}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#78716c", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14 }}>
            Compteur — date du prochain drop
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{formatDate(current?.dropDate)}</span>
            <StatusBadge
              active={!!(current?.dropDate && !dropExpired)}
              activeLabel="Actif"
              inactiveLabel={current?.dropDate ? "Expiré — compteur caché" : "Non défini"}
            />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); patch("dropDate", dropDate ? new Date(dropDate).toISOString() : null, "Date du drop"); }}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={labelStyle}>Date & heure *</label>
              <input style={inputStyle} type="datetime-local" value={dropDate} onChange={(e) => setDropDate(e.target.value)} />
              <p style={{ fontSize: 11, color: "#a8a29e", marginTop: 5 }}>
                Le compteur est affiché sur la page d'accueil jusqu'à cette date, puis se cache automatiquement.
              </p>
            </div>
            {errors.dropDate && <p style={{ fontSize: 13, color: "#C95D5D" }}>{errors.dropDate}</p>}
            <button type="submit" className="ap-btn-add" style={{ alignSelf: "flex-start" }} disabled={saving === "dropDate"}>
              {saving === "dropDate" ? "Sauvegarde…" : "Enregistrer"}
            </button>
          </form>
        </div>

        {/* ── Bandeau header ── */}
        <div style={cardStyle}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#78716c", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14 }}>
            Bandeau header
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "#57534e", fontStyle: current?.bandeauText ? "normal" : "italic" }}>
              {current?.bandeauText || "Aucun texte — bandeau masqué"}
            </span>
            <StatusBadge active={!!current?.bandeauText} activeLabel="Visible" inactiveLabel="Masqué" />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); patch("bandeauText", bandeauText, "Bandeau"); }}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={labelStyle}>Texte du bandeau</label>
              <input style={inputStyle} type="text" placeholder="Nouvel arrivage le 01/09/2026 à 19H" value={bandeauText}
                onChange={(e) => setBandeauText(e.target.value)} />
              <p style={{ fontSize: 11, color: "#a8a29e", marginTop: 5 }}>
                Affiché en haut de toutes les pages (sauf accueil). Laisser vide pour masquer.
              </p>
            </div>
            {errors.bandeauText && <p style={{ fontSize: 13, color: "#C95D5D" }}>{errors.bandeauText}</p>}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="submit" className="ap-btn-add" style={{ alignSelf: "flex-start" }} disabled={saving === "bandeauText"}>
                {saving === "bandeauText" ? "Sauvegarde…" : "Enregistrer"}
              </button>
              {bandeauText && (
                <button type="button" disabled={saving === "bandeauText"}
                  onClick={() => { setBandeauText(""); patch("bandeauText", "", "Bandeau"); }}
                  style={{ padding: "10px 16px", background: "#fff", border: "1.5px solid #e7e5e4", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#C95D5D" }}>
                  Masquer
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ── Badge / notif hero ── */}
        <div style={cardStyle}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#78716c", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14 }}>
            Notification hero (page d'accueil)
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "#57534e", fontStyle: current?.badgeText ? "normal" : "italic" }}>
              {current?.badgeText || "Aucun texte — notification masquée"}
            </span>
            <StatusBadge active={!!current?.badgeText} activeLabel="Visible" inactiveLabel="Masquée" />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); patch("badgeText", badgeText, "Notification hero"); }}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={labelStyle}>Texte de la notification</label>
              <input style={inputStyle} type="text" placeholder="Nouvel arrivage le 01/09/2026 à 19H" value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)} />
              <p style={{ fontSize: 11, color: "#a8a29e", marginTop: 5 }}>
                Badge clochette affiché sur la page d'accueil. Laisser vide pour masquer.
              </p>
            </div>
            {errors.badgeText && <p style={{ fontSize: 13, color: "#C95D5D" }}>{errors.badgeText}</p>}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="submit" className="ap-btn-add" style={{ alignSelf: "flex-start" }} disabled={saving === "badgeText"}>
                {saving === "badgeText" ? "Sauvegarde…" : "Enregistrer"}
              </button>
              {badgeText && (
                <button type="button" disabled={saving === "badgeText"}
                  onClick={() => { setBadgeText(""); patch("badgeText", "", "Notification hero"); }}
                  style={{ padding: "10px 16px", background: "#fff", border: "1.5px solid #e7e5e4", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#C95D5D" }}>
                  Masquer
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ── Mode maintenance ── */}
        <div style={cardStyle}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#78716c", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14 }}>
            Mode maintenance
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <button
              type="button"
              className={`ap-toggle ${current?.maintenanceMode ? "on" : "off"}`}
              onClick={toggleMaintenance}
              disabled={saving === "maintenanceMode"}
              title={current?.maintenanceMode ? "Désactiver le mode maintenance" : "Activer le mode maintenance"}
            >
              <span className="ap-toggle-thumb" />
            </button>
            <StatusBadge active={!!current?.maintenanceMode} activeLabel="Activé" inactiveLabel="Désactivé" />
          </div>
          <p style={{ fontSize: 11, color: "#a8a29e", marginTop: 5 }}>
            Une fois activé, les visiteurs de <strong>pull-lover.com</strong> voient un écran
            « site en cours de construction ». Le lien de déploiement Vercel (*.vercel.app)
            n&apos;est pas concerné : vous pouvez continuer à y accéder normalement pour
            travailler sur le site, tout comme depuis ce panneau d&apos;administration une fois connecté.
          </p>
          {errors.maintenanceMode && <p style={{ fontSize: 13, color: "#C95D5D", marginTop: 8 }}>{errors.maintenanceMode}</p>}
        </div>

      </div>
    </div>
  );
}
