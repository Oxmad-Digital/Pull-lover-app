"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/app/hooks/useToast";
import { useConfirmDialog } from "@/app/hooks/useConfirmDialog";
import { Toast } from "@/app/components/ui/Toast";
import { ConfirmationDialog } from "@/app/components/ui/ConfirmationDialog";
import "../customers/customers.css";

const EMPTY_FORM = {
  code: "",
  description: "",
  type: "percentage",
  value: "",
  minOrderAmount: "",
  maxUses: "",
  expiresAt: "",
  isActive: true,
};

export default function AdminPromosPage() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const { toast, showToast }                    = useToast();
  const { confirmModal, askConfirm, closeConfirm } = useConfirmDialog();

  useEffect(() => {
    const t = setTimeout(() => load(), 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    const res = await fetch(`/api/admin/promos?${params}`);
    const data = await res.json();
    setPromos(data.promos || []);
    setLoading(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError("");
    if (!form.code || !form.type || !form.value) {
      setFormError("Code, type et valeur sont requis.");
      return;
    }
    setFormLoading(true);
    const res = await fetch("/api/admin/promos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setFormLoading(false);
    if (!res.ok) {
      setFormError(data.error || "Erreur lors de la création");
    } else {
      setShowForm(false);
      setForm(EMPTY_FORM);
      showToast("Code promo créé");
      load();
    }
  }

  async function handleToggle(promo) {
    const res = await fetch("/api/admin/promos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: promo._id, isActive: !promo.isActive }),
    });
    if (res.ok) {
      showToast(promo.isActive ? "Code désactivé" : "Code activé");
      load();
    }
  }

  function handleDelete(promo) {
    askConfirm(`Supprimer "${promo.code}" ? Cette action est irréversible.`, async () => {
      const res = await fetch(`/api/admin/promos?id=${promo._id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Code supprimé");
        load();
      }
    });
  }

  function formatDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fr-FR", { dateStyle: "medium" });
  }

  return (
    <div className="ap-page">

      <Toast toast={toast} />
      <ConfirmationDialog confirmModal={confirmModal} onClose={closeConfirm} />

      {/* Topbar */}
      <div className="ap-topbar">
        <h1 className="ap-topbar-title">Codes promo</h1>
      </div>

      {/* Toolbar */}
      <div className="ap-toolbar">
        <input
          className="ap-search-input promo-search-input"
          placeholder="Rechercher un code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="ap-btn-add" onClick={() => { setShowForm(true); setForm(EMPTY_FORM); setFormError(""); }}>
          Nouveau code
        </button>
        <div className="ap-stats-inline">
          <div className="ap-stat-chip">
            <span className="ap-stat-chip-value">{promos.length}</span>
            <span className="ap-stat-chip-label">codes</span>
          </div>
          <div className="ap-stat-chip">
            <span className="ap-stat-chip-value">{promos.filter((p) => p.isActive).length}</span>
            <span className="ap-stat-chip-label">actifs</span>
          </div>
        </div>
      </div>

      {/* Formulaire création */}
      {showForm && (
        <div className="promo-form-wrap">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: "#252323" }}>
            Nouveau code promo
          </h2>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="promo-form-grid">
              <div>
                <label style={labelStyle}>Code *</label>
                <input
                  placeholder="SUMMER20"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <input
                  placeholder="Soldes été 2026"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <label style={labelStyle}>Type *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="percentage">Pourcentage (%)</option>
                  <option value="fixed">Montant fixe (€)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>
                  Valeur * {form.type === "percentage" ? "(en %)" : "(en €)"}
                </label>
                <input
                  type="number"
                  min="0"
                  max={form.type === "percentage" ? 100 : undefined}
                  placeholder={form.type === "percentage" ? "20" : "10"}
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Montant minimum (€)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.minOrderAmount}
                  onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                />
              </div>
              <div>
                <label style={labelStyle}>Utilisations max (vide = illimité)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="—"
                  value={form.maxUses}
                  onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                />
              </div>
              <div>
                <label style={labelStyle}>Date d'expiration</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 20 }}>
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  style={{ width: 16, height: 16, cursor: "pointer" }}
                />
                <label htmlFor="isActive" style={{ fontSize: 13, color: "#57534e", cursor: "pointer" }}>
                  Actif immédiatement
                </label>
              </div>
            </div>

            {formError && (
              <p style={{ fontSize: 13, color: "#C75C5C", margin: 0 }}>{formError}</p>
            )}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="submit" className="ap-btn-add" disabled={formLoading}>
                {formLoading ? "Création…" : "Créer le code"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  padding: "10px 20px", background: "#fff", border: "1.5px solid #e7e5e4",
                  borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#57534e",
                }}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="ap-table-wrap">
        {loading ? (
          <div className="admin-loading-wrap"><span className="admin-loader" />Chargement</div>
        ) : promos.length === 0 ? (
          <p style={{ padding: "32px", textAlign: "center", color: "#a8a29e" }}>Aucun code promo trouvé.</p>
        ) : (
          <table className="ap-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Valeur</th>
                <th>Min. commande</th>
                <th>Utilisations</th>
                <th>Expiration</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {promos.map((promo) => (
                <tr key={promo._id} style={{ borderBottom: "1px solid #f5f5f4" }}>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#252323", letterSpacing: "0.04em" }}>
                      {promo.code}
                    </span>
                    {promo.description && (
                      <span style={{ display: "block", fontSize: 11, color: "#a8a29e", marginTop: 2 }}>
                        {promo.description}
                      </span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20,
                      background: promo.type === "percentage" ? "#eff6ff" : "#fdf4ff",
                      color: promo.type === "percentage" ? "#1d4ed8" : "#7e22ce",
                    }}>
                      {promo.type === "percentage" ? "%" : "€ fixe"}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 700, color: "#C75C5C" }}>
                      {promo.type === "percentage" ? `${promo.value}%` : `${promo.value} €`}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: "#78716c" }}>
                    {promo.minOrderAmount > 0 ? `${promo.minOrderAmount} €` : "—"}
                  </td>
                  <td style={tdStyle}>
                    <span style={{ color: "#57534e" }}>
                      {promo.usedCount}
                      {promo.maxUses !== null ? ` / ${promo.maxUses}` : ""}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: "#78716c" }}>{formatDate(promo.expiresAt)}</td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => handleToggle(promo)}
                      style={{
                        fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
                        border: "none", cursor: "pointer",
                        background: promo.isActive ? "#dcfce7" : "#fee2e2",
                        color: promo.isActive ? "#15803d" : "#b91c1c",
                      }}
                    >
                      {promo.isActive ? "Actif" : "Inactif"}
                    </button>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <button
                      onClick={() => handleDelete(promo)}
                      style={{
                        background: "none", border: "none", color: "#C75C5C",
                        cursor: "pointer", fontSize: 13, fontWeight: 600,
                      }}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}

const labelStyle = {
  display: "block", fontSize: 11, fontWeight: 700, color: "#78716c",
  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em",
};

const tdStyle = { padding: "12px 16px", fontSize: 13 };
