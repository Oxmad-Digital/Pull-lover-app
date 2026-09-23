"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/app/hooks/useToast";
import { useConfirmDialog } from "@/app/hooks/useConfirmDialog";
import { Toast } from "@/app/components/ui/Toast";
import { ConfirmationDialog } from "@/app/components/ui/ConfirmationDialog";

const P = {
  bg:     "var(--pl-paper)",
  card:   "#fff",
  border: "var(--pl-line)",
  text:   "var(--pl-ink)",
  muted:  "var(--pl-muted)",
  accent: "var(--pl-lake)",
  font:   "var(--pl-sans)",
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [newName, setNewName]       = useState("");
  const [editingId, setEditingId]   = useState(null);
  const [editName, setEditName]     = useState("");
  const inputRef = useRef(null);
  const { toast, showToast }                    = useToast();
  const { confirmModal, askConfirm, closeConfirm } = useConfirmDialog();

  const fetchCategories = () => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => { setCategories(Array.isArray(data) ? data : []); setLoading(false); });
  };

  useEffect(() => { fetchCategories(); }, []);

  useEffect(() => {
    if (showForm) setTimeout(() => inputRef.current?.focus(), 50);
  }, [showForm]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const res  = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.message || "Erreur", "error"); return; }
    setNewName("");
    setShowForm(false);
    fetchCategories();
    showToast("Catégorie créée");
  };

  const startEdit = (cat) => { setEditingId(cat._id); setEditName(cat.name); };
  const cancelEdit = ()    => { setEditingId(null); setEditName(""); };

  const handleRename = async (id) => {
    if (!editName.trim()) return;
    const res  = await fetch("/api/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: editName.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.message || "Erreur", "error"); return; }
    setCategories((prev) => prev.map((c) => c._id === id ? { ...c, name: data.name } : c));
    cancelEdit();
    showToast("Catégorie renommée");
  };

  const handleDelete = (id, name) => {
    askConfirm(`Supprimer "${name}" ? Cette action est irréversible.`, async () => {
      const res  = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { showToast(data.message || "Erreur", "error"); return; }
      setCategories((prev) => prev.filter((c) => c._id !== id));
      showToast("Catégorie supprimée");
    });
  };

  return (
    <div className="admin-page" style={{ minHeight: "100vh", background: P.bg, fontFamily: P.font }}>

      <Toast toast={toast} />
      <ConfirmationDialog confirmModal={confirmModal} onClose={closeConfirm} />

      {/* Topbar */}
      <div className="ap-topbar">
        <h1 className="ap-topbar-title">
          Catégories
        </h1>

        <button
          onClick={() => { setShowForm((v) => !v); setNewName(""); }}
          className="ap-btn-add"
          style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "10px 20px", background: P.accent, color: "#fff",
            border: "none", borderRadius: "9px", fontSize: "13px",
            fontWeight: "700", fontFamily: P.font, cursor: "pointer",
            transition: "background 0.2s", flexShrink: 0,
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#b04d4d"}
          onMouseLeave={(e) => e.currentTarget.style.background = P.accent}
        >
          Nouvelle catégorie
        </button>
      </div>

      {/* Formulaire d'ajout inline */}
      {showForm && (
        <form onSubmit={handleCreate} className="admin-cat-form ap-toolbar" style={{
          display: "flex", gap: "8px", alignItems: "center",
          background: P.card, border: `1px solid ${P.border}`,
          borderRadius: "12px", padding: "14px 18px", marginBottom: "16px",
        }}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Nom de la catégorie…"
            className="ap-search-input"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{
              flex: 1, minWidth: 0, padding: "8px 13px", border: `1.5px solid ${P.border}`,
              borderRadius: "8px", fontSize: "13px", fontFamily: P.font,
              color: P.text, background: "#fafaf9", outline: "none",
            }}
            onFocus={(e)  => { e.target.style.borderColor = P.accent; e.target.style.background = P.card; }}
            onBlur={(e)   => { e.target.style.borderColor = P.border; e.target.style.background = "#fafaf9"; }}
          />
          <button type="submit" className="ap-search-btn" style={{
            padding: "8px 18px", background: P.text, color: "#fff",
            border: "none", borderRadius: "8px", fontSize: "13px",
            fontWeight: "600", fontFamily: P.font, cursor: "pointer",
          }}>
            Créer
          </button>
          <button type="button" onClick={() => setShowForm(false)} className="ap-back-btn" style={{
            padding: "8px 14px", background: "#f5f5f4", color: "#78716c",
            border: `1.5px solid ${P.border}`, borderRadius: "8px",
            fontSize: "13px", fontWeight: "600", fontFamily: P.font, cursor: "pointer",
          }}>
            Annuler
          </button>
        </form>
      )}

      {/* Table */}
      <div className="ap-table-wrap">
        {loading ? (
          <div className="admin-loading-wrap"><span className="admin-loader" />Chargement</div>
        ) : categories.length === 0 ? (
          <div style={{ padding: "60px 24px", textAlign: "center", color: P.muted, fontSize: "15px", fontFamily: P.font }}>
            Aucune catégorie. Créez-en une !
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
          <table className="ap-table" style={{ minWidth: "480px" }}>
            <thead>
              <tr style={{ background: "#fafaf9", borderBottom: `1px solid ${P.border}` }}>
                {["Nom", "Créée le", "Actions"].map((h) => (
                  <th key={h} style={{
                    padding: "11px 18px", textAlign: "left", fontSize: "11px",
                    fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em",
                    color: P.muted, fontFamily: P.font, whiteSpace: "nowrap",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, i) => (
                <tr
                  key={cat._id}
                  style={{ borderTop: i === 0 ? "none" : `1px solid #f5f5f4`, transition: "background 0.1s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#fafaf9"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  {/* Nom / Rename inline */}
                  <td style={{ padding: "13px 18px", fontFamily: P.font }}>
                    {editingId === cat._id ? (
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleRename(cat._id); if (e.key === "Escape") cancelEdit(); }}
                        style={{
                          padding: "6px 10px", border: `1.5px solid ${P.accent}`,
                          borderRadius: "7px", fontSize: "14px", fontFamily: P.font,
                          color: P.text, background: P.card, outline: "none", width: "220px",
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: "14px", fontWeight: "600", color: P.text }}>
                        {cat.name}
                      </span>
                    )}
                  </td>

                  {/* Date */}
                  <td style={{ padding: "13px 18px", fontSize: "13px", color: "#78716c", fontFamily: P.font, whiteSpace: "nowrap" }}>
                    {new Date(cat.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: "13px 18px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {editingId === cat._id ? (
                        <>
                          <ActionBtn onClick={() => handleRename(cat._id)} variant="save">Sauvegarder</ActionBtn>
                          <ActionBtn onClick={cancelEdit} variant="cancel">Annuler</ActionBtn>
                        </>
                      ) : (
                        <>
                          <ActionBtn onClick={() => startEdit(cat)} variant="edit">Modifier</ActionBtn>
                          <ActionBtn onClick={() => handleDelete(cat._id, cat.name)} variant="delete">Supprimer</ActionBtn>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Compteur */}
      {!loading && categories.length > 0 && (
        <p style={{ marginTop: "12px", fontSize: "12px", color: P.muted, fontFamily: P.font }}>
          {categories.length} catégorie{categories.length > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

function ActionBtn({ onClick, variant, children }) {
  const styles = {
    edit:   { bg: "#f5f5f4", color: "#252323", border: "var(--pl-line)", hoverBg: "#252323", hoverColor: "#fff" },
    delete: { bg: "#fff1f2", color: "#be123c", border: "#fecdd3", hoverBg: "#be123c", hoverColor: "#fff" },
    save:   { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0", hoverBg: "#15803d", hoverColor: "#fff" },
    cancel: { bg: "#f5f5f4", color: "#78716c", border: "var(--pl-line)", hoverBg: "#78716c", hoverColor: "#fff" },
  };
  const s = styles[variant];
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 12px", background: s.bg, color: s.color,
        border: `1.5px solid ${s.border}`, borderRadius: "7px",
        fontSize: "12px", fontWeight: "600",
        fontFamily: "var(--pl-sans)",
        cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = s.hoverBg; e.currentTarget.style.color = s.hoverColor; e.currentTarget.style.borderColor = s.hoverBg; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = s.bg; e.currentTarget.style.color = s.color; e.currentTarget.style.borderColor = s.border; }}
    >
      {children}
    </button>
  );
}
