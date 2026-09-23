"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/app/hooks/useToast";
import { Toast } from "@/app/components/ui/Toast";
import "../customers/customers.css";

const PER_PAGE = 50;

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState([]);
  const [total, setTotal]             = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [page, setPage]               = useState(1);
  const [addModal, setAddModal]        = useState(false);
  const [addEmail, setAddEmail]        = useState("");
  const [addLoading, setAddLoading]    = useState(false);
  const { toast, showToast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => load(), 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: PER_PAGE });
    if (search) params.append("search", search);
    const res = await fetch(`/api/admin/newsletter?${params}`);
    const data = await res.json();
    setSubscribers(data.subscribers || []);
    setTotal(data.total || 0);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    setAddLoading(true);
    const res = await fetch("/api/admin/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: addEmail.trim() }),
    });
    const data = await res.json();
    setAddLoading(false);
    if (res.ok) {
      showToast("Abonné ajouté avec succès");
      setAddModal(false);
      setAddEmail("");
      load();
    } else {
      showToast(data.error || "Erreur lors de l'ajout", "error");
    }
  }

  async function handleDelete(id, email) {
    if (!confirm(`Supprimer ${email} de la newsletter ?`)) return;
    const res = await fetch("/api/admin/newsletter", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      showToast("Abonné supprimé");
      load();
    } else {
      showToast("Erreur lors de la suppression", "error");
    }
  }

  function exportCSV() {
    const rows = [["Email", "Date d'inscription"]];
    subscribers.forEach((s) =>
      rows.push([s.email, new Date(s.createdAt).toLocaleDateString("fr-FR")])
    );
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="ap-page">
      {/* Topbar */}
      <div className="ap-topbar">
        <h1 className="ap-topbar-title">Newsletter</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="ap-btn-add" onClick={() => setAddModal(true)}>
            Ajouter
          </button>
          <button className="ap-btn-add" onClick={exportCSV} disabled={loading || total === 0}
            style={{ background: "#fff", color: "#252323", border: "1.5px solid #e7e5e4" }}>
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="ap-toolbar">
        <input
          className="ap-search-input"
          placeholder="Rechercher un email…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <div className="ap-stats-inline">
          <div className="ap-stat-chip">
            <span className="ap-stat-chip-value">{total}</span>
            <span className="ap-stat-chip-label">abonnés</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="ap-table-wrap">
        {loading ? (
          <div className="admin-loading-wrap"><span className="admin-loader" />Chargement</div>
        ) : subscribers.length === 0 ? (
          <p style={{ padding: "32px", textAlign: "center", color: "#a8a29e" }}>Aucun abonné trouvé.</p>
        ) : (
          <table className="ap-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Email</th>
                <th>Inscrit le</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s, i) => (
                <tr key={s._id} style={{ borderBottom: "1px solid #f5f5f4" }}>
                  <td style={{ padding: "12px 16px", color: "#a8a29e", fontSize: 13 }}>
                    {(page - 1) * PER_PAGE + i + 1}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 600, fontSize: 14 }}>{s.email}</td>
                  <td style={{ padding: "12px 16px", color: "#78716c", fontSize: 13 }}>
                    {new Date(s.createdAt).toLocaleDateString("fr-FR", { dateStyle: "medium" })}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <button
                      onClick={() => handleDelete(s._id, s.email)}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
          <button className="ap-filter-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Préc.
          </button>
          <span style={{ padding: "8px 16px", fontSize: 13, color: "#57534e" }}>
            {page} / {totalPages}
          </span>
          <button className="ap-filter-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Suiv.
          </button>
        </div>
      )}

      {/* Modal ajout */}
      {addModal && (
        <div
          onClick={() => { setAddModal(false); setAddEmail(""); }}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.4)", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 14, padding: "32px 28px",
              width: "100%", maxWidth: 420, boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "#252323" }}>
              Ajouter un abonné
            </h2>
            <form onSubmit={handleAdd}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#57534e", display: "block", marginBottom: 6 }}>
                Adresse email
              </label>
              <input
                type="email"
                required
                autoFocus
                className="ap-search-input"
                style={{ width: "100%", marginBottom: 20 }}
                placeholder="exemple@email.com"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
              />
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => { setAddModal(false); setAddEmail(""); }}
                  className="ap-filter-btn"
                  style={{ minWidth: 90 }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="ap-btn-add"
                  disabled={addLoading}
                  style={{ minWidth: 90 }}
                >
                  {addLoading ? "Ajout…" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
}
