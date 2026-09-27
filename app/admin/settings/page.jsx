"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/app/hooks/useToast";
import { Toast } from "@/app/components/ui/Toast";
import "../customers/customers.css";

const labelStyle = {
  display: "block", fontSize: 11, fontWeight: 700, color: "#78716c",
  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em",
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
  const [dropMode, setDropMode]     = useState("date");
  const [dur, setDur]                 = useState({ days: "", hours: "", minutes: "" });
  const [releaseDate, setReleaseDate] = useState("");
  const [due, setDue]                 = useState(null);
  const [releasing, setReleasing]     = useState(false);
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
    setReleaseDate(toLocalDatetimeValue(data.shippingReleaseDate));
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

  const durMs = ((+dur.days || 0) * 86400 + (+dur.hours || 0) * 3600 + (+dur.minutes || 0) * 60) * 1000;

  function submitDrop(e) {
    e.preventDefault();
    let iso = null;
    if (dropMode === "duration") {
      if (durMs <= 0) {
        setErrors((er) => ({ ...er, dropDate: "Renseignez une durée supérieure à 0" }));
        return;
      }
      iso = new Date(Date.now() + durMs).toISOString();
    } else if (dropDate) {
      iso = new Date(dropDate).toISOString();
    }
    patch("dropDate", iso, "Date du drop");
  }

  async function checkDue() {
    const res = await fetch("/api/admin/orders/release");
    const data = await res.json();
    if (res.ok) setDue(data); else showToast(data.message || "Erreur", "error");
  }

  async function releaseNow() {
    if (!window.confirm(`Envoyer ${due.count} commande(s) au transporteur ? Action irréversible.`)) return;
    setReleasing(true);
    const res = await fetch("/api/admin/orders/release", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: true }),
    });
    const data = await res.json();
    setReleasing(false);
    if (!res.ok) { showToast(data.message || "Erreur", "error"); return; }
    const ok = data.results.filter((r) => r.ok).length;
    showToast(`${ok}/${data.results.length} commande(s) expédiée(s)`, ok === data.results.length ? undefined : "error");
    setDue(null);
  }

  const dropNow = new Date();
  const dropExpired = current?.dropDate && new Date(current.dropDate) < dropNow;

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
          gap: 24px;
          align-items: start;
        }
        .content-grid .admin-content-card {
          background: #fff;
          border: 1px solid #e7e5e4;
          border-radius: 8px;
          padding: 28px 32px;
          min-width: 0;
        }
        .content-grid .admin-content-card input[type="text"],
        .content-grid .admin-content-card input[type="datetime-local"] {
          width: 100%;
          box-sizing: border-box;
          padding: 11px 14px;
        }
        .content-grid .admin-content-card form { gap: 18px !important; }
        .content-grid .admin-content-card .ap-btn-add { padding: 11px 22px; }
        @media (max-width: 560px) {
          .content-grid .admin-content-card { padding: 20px; }
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
        .ap-toggle.on  { background: #C75C5C; }
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

      <div className="content-grid" style={{ marginTop: 32 }}>

        {/* ── Compteur drop ── */}
        <div className="admin-content-card">
          <p style={{ fontSize: 12, fontWeight: 700, color: "#78716c", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14 }}>
            Compteur — date du prochain drop
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#252323" }}>{formatDate(current?.dropDate)}</span>
            <StatusBadge
              active={!!(current?.dropDate && !dropExpired)}
              activeLabel="Actif"
              inactiveLabel={current?.dropDate ? "Expiré — compteur caché" : "Non défini"}
            />
          </div>
          <form onSubmit={submitDrop} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 8 }}>
              {[["date", "Date précise"], ["duration", "Durée"]].map(([m, l]) => (
                <button key={m} type="button" onClick={() => setDropMode(m)}
                  style={{ padding: "7px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    border: "1.5px solid " + (dropMode === m ? "#C75C5C" : "#e7e5e4"),
                    background: dropMode === m ? "#C75C5C" : "#fff", color: dropMode === m ? "#fff" : "#57534e" }}>
                  {l}
                </button>
              ))}
            </div>
            {dropMode === "date" ? (
              <div>
                <label style={labelStyle}>Date & heure *</label>
                <input type="datetime-local" value={dropDate} onChange={(e) => setDropDate(e.target.value)} />
                <p style={{ fontSize: 11, color: "#a8a29e", marginTop: 5 }}>
                  Le compteur est affiché sur la page d'accueil jusqu'à cette date, puis se cache automatiquement.
                </p>
              </div>
            ) : (
              <div>
                <label style={labelStyle}>Durée à partir de maintenant *</label>
                <div style={{ display: "flex", gap: 10 }}>
                  {[["days", "Jours"], ["hours", "Heures"], ["minutes", "Minutes"]].map(([k, l]) => (
                    <div key={k} style={{ flex: 1 }}>
                      <input type="number" min="0" placeholder="0" value={dur[k]}
                        onChange={(e) => setDur((d) => ({ ...d, [k]: e.target.value }))}
                        style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px" }} />
                      <span style={{ fontSize: 11, color: "#a8a29e" }}>{l}</span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: "#a8a29e", marginTop: 5 }}>
                  {durMs > 0 ? `Fin du compteur : ${formatDate(new Date(Date.now() + durMs))}` : "Le compteur démarre à l'enregistrement."}
                </p>
              </div>
            )}
            {errors.dropDate && <p style={{ fontSize: 13, color: "#C75C5C" }}>{errors.dropDate}</p>}
            <button type="submit" className="ap-btn-add" style={{ alignSelf: "flex-start" }} disabled={saving === "dropDate"}>
              {saving === "dropDate" ? "Sauvegarde…" : "Enregistrer"}
            </button>
          </form>
        </div>

        {/* ── Expédition : fin de la période de drop ── */}
        <div className="admin-content-card">
          <p style={{ fontSize: 12, fontWeight: 700, color: "#78716c", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14 }}>
            Expédition — fin de la période de drop
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#252323" }}>{formatDate(current?.shippingReleaseDate)}</span>
            <StatusBadge
              active={!!(current?.shippingReleaseDate && new Date(current.shippingReleaseDate) > dropNow)}
              activeLabel="Envois en attente"
              inactiveLabel={current?.shippingReleaseDate ? "Terminée" : "Non définie"}
            />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); patch("shippingReleaseDate", releaseDate ? new Date(releaseDate).toISOString() : null, "Date d'expédition"); }}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={labelStyle}>Date d&apos;envoi aux transporteurs</label>
              <input type="datetime-local" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} />
              <p style={{ fontSize: 11, color: "#a8a29e", marginTop: 5 }}>
                Les commandes passées avant cette date sont enregistrées mais ne sont PAS envoyées au transporteur. S&apos;applique aux nouvelles commandes.
              </p>
            </div>
            <button type="submit" className="ap-btn-add" style={{ alignSelf: "flex-start" }} disabled={saving === "shippingReleaseDate"}>
              {saving === "shippingReleaseDate" ? "Sauvegarde…" : "Enregistrer"}
            </button>
          </form>
          <div style={{ borderTop: "1px solid #e7e5e4", marginTop: 18, paddingTop: 16 }}>
            <button type="button" className="ap-btn-add" onClick={checkDue}>Voir les commandes à expédier</button>
            {due && (
              <p style={{ fontSize: 13, color: "#57534e", marginTop: 10 }}>
                {due.count} commande(s) payée(s) dont la période de drop est terminée.
                {due.count > 0 && (
                  <button type="button" className="ap-btn-add" style={{ marginLeft: 10 }} onClick={releaseNow} disabled={releasing}>
                    {releasing ? "Envoi…" : "Envoyer au transporteur"}
                  </button>
                )}
              </p>
            )}
          </div>
        </div>

        {/* ── Bandeau header ── */}
        <div className="admin-content-card">
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
              <input type="text" placeholder="Nouvel arrivage le 01/09/2026 à 19H" value={bandeauText}
                onChange={(e) => setBandeauText(e.target.value)} />
              <p style={{ fontSize: 11, color: "#a8a29e", marginTop: 5 }}>
                Affiché en haut de toutes les pages (sauf accueil). Laisser vide pour masquer.
              </p>
            </div>
            {errors.bandeauText && <p style={{ fontSize: 13, color: "#C75C5C" }}>{errors.bandeauText}</p>}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="submit" className="ap-btn-add" style={{ alignSelf: "flex-start" }} disabled={saving === "bandeauText"}>
                {saving === "bandeauText" ? "Sauvegarde…" : "Enregistrer"}
              </button>
              {bandeauText && (
                <button type="button" disabled={saving === "bandeauText"}
                  onClick={() => { setBandeauText(""); patch("bandeauText", "", "Bandeau"); }}
                  style={{ padding: "10px 16px", background: "#fff", border: "1.5px solid #e7e5e4", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#C75C5C" }}>
                  Masquer
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ── Badge / notif hero ── */}
        <div className="admin-content-card">
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
              <input type="text" placeholder="Nouvel arrivage le 01/09/2026 à 19H" value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)} />
              <p style={{ fontSize: 11, color: "#a8a29e", marginTop: 5 }}>
                Badge clochette affiché sur la page d'accueil. Laisser vide pour masquer.
              </p>
            </div>
            {errors.badgeText && <p style={{ fontSize: 13, color: "#C75C5C" }}>{errors.badgeText}</p>}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="submit" className="ap-btn-add" style={{ alignSelf: "flex-start" }} disabled={saving === "badgeText"}>
                {saving === "badgeText" ? "Sauvegarde…" : "Enregistrer"}
              </button>
              {badgeText && (
                <button type="button" disabled={saving === "badgeText"}
                  onClick={() => { setBadgeText(""); patch("badgeText", "", "Notification hero"); }}
                  style={{ padding: "10px 16px", background: "#fff", border: "1.5px solid #e7e5e4", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#C75C5C" }}>
                  Masquer
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ── Mode maintenance ── */}
        <div className="admin-content-card">
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
          {errors.maintenanceMode && <p style={{ fontSize: 13, color: "#C75C5C", marginTop: 8 }}>{errors.maintenanceMode}</p>}
        </div>

      </div>
    </div>
  );
}
