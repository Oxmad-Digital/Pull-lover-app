"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useToast } from "@/app/hooks/useToast";
import { useConfirmDialog } from "@/app/hooks/useConfirmDialog";
import { useClickOutside } from "@/app/hooks/useClickOutside";
import { usePaginatedFetch } from "@/app/hooks/usePaginatedFetch";
import { Toast } from "@/app/components/ui/Toast";
import { ConfirmationDialog } from "@/app/components/ui/ConfirmationDialog";
import "./orders-admin.css";

const PER_PAGE = 20;

const STATUS_OPTIONS = [
  { value: "pending",    label: "En attente"     },
  { value: "confirmed",  label: "Confirmée"      },
  { value: "processing", label: "En préparation" },
  { value: "paid",       label: "Payée"          },
  { value: "shipped",    label: "Expédiée"       },
  { value: "delivered",  label: "Livrée"         },
  { value: "cancelled",  label: "Annulée"        },
];

const PAYMENT_LABELS = {
  cash:          "Espèces",
  mobile_money:  "Mobile Money",
  card:          "Carte",
  bank_transfer: "Virement",
};

const CHIP_FILTERS = [
  { value: "",            label: "Toutes",      statsKey: "total",      color: "#252323" },
  { value: "pending",     label: "En attente",  statsKey: "pending",    color: "#b45309" },
  { value: "confirmed",   label: "Confirmées",  statsKey: "confirmed",  color: "#C75C5C" },
  { value: "processing",  label: "Préparation", statsKey: "processing", color: "#6d28d9" },
  { value: "paid",        label: "Payées",      statsKey: "paid",       color: "#15803d" },
  { value: "shipped",     label: "Expédiées",   statsKey: "shipped",    color: "#0e7490" },
  { value: "delivered",   label: "Livrées",     statsKey: "delivered",  color: "#15803d" },
  { value: "cancelled",   label: "Annulées",    statsKey: "cancelled",  color: "#be123c" },
];

const SORT_OPTIONS = [
  { label: "Date",  value: "createdAt" },
  { label: "Total", value: "total"     },
];

export default function AdminOrdersPage() {
  const [search, setSearch]                   = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter]       = useState("");
  const [sort, setSort]                       = useState("createdAt");
  const [sortDir, setSortDir]                 = useState("desc");
  const [stats, setStats]                     = useState(null);
  const [updatingId, setUpdatingId]           = useState(null);
  const [exporting, setExporting]             = useState(false);
  const [filterOpen, setFilterOpen]           = useState(false);
  const [sortOpen, setSortOpen]               = useState(false);
  const filterRef = useRef(null);
  const sortRef   = useRef(null);

  const { toast, showToast }                    = useToast();
  const { confirmModal, askConfirm, closeConfirm } = useConfirmDialog();
  useClickOutside([
    [sortRef,   () => setSortOpen(false)],
    [filterRef, () => setFilterOpen(false)],
  ]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const queryParams = {
    sort, order: sortDir,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(statusFilter    && { status: statusFilter }),
  };

  const { items: orders, pagination, loading, page, setPage } =
    usePaginatedFetch("/api/admin/orders", queryParams, {
      itemsKey: "orders",
      perPage:  PER_PAGE,
      onData:   (data) => setStats(data.stats ?? null),
    });

  // Mutations locales (update statut, suppression)
  const [localOrders, setLocalOrders] = useState([]);
  useEffect(() => { setLocalOrders(orders); }, [orders]);

  const updateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const res  = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message || "Erreur lors du changement de statut", "error"); return; }
      setLocalOrders(prev => prev.map(o => o._id === data._id ? data : o));
      showToast("Statut mis à jour");
    } catch {
      showToast("Erreur serveur", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteOrder = (id) => {
    askConfirm(
      "Supprimer cette commande définitivement ?",
      async () => {
        try {
          const res  = await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
          const data = await res.json();
          if (res.ok) {
            setLocalOrders(prev => prev.filter(o => o._id !== id));
            showToast("Commande supprimée");
          } else {
            showToast(data.message || "Impossible de supprimer", "error");
          }
        } catch {
          showToast("Erreur serveur", "error");
        }
      },
      "Supprimer"
    );
  };

  const exportCSV = async () => {
    setExporting(true);
    try {
      const p = new URLSearchParams({ sort, order: sortDir, limit: 9999 });
      if (debouncedSearch) p.append("search", debouncedSearch);
      if (statusFilter)    p.append("status", statusFilter);

      const res  = await fetch(`/api/admin/orders?${p}`);
      const data = await res.json();
      if (!data.orders) return;

      const headers = ["Prénom","Nom","Email","Téléphone","Adresse","Ville","Total (€)","Paiement","Statut","Date"];
      const rows = data.orders.map(o => {
        const c = o.customer || {};
        return [
          c.firstname || "", c.lastname || "", c.email || "",
          c.phone || "", c.address || "", c.city || "",
          o.total || 0,
          PAYMENT_LABELS[o.payment] || o.payment || "",
          STATUS_OPTIONS.find(s => s.value === o.status)?.label || o.status || "",
          o.createdAt ? new Date(o.createdAt).toLocaleDateString("fr-FR") : "",
        ].join(";");
      });

      const csv  = [headers.join(";"), ...rows].join("\n");
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `commandes_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="ap-page">

      <Toast toast={toast} />
      <ConfirmationDialog confirmModal={confirmModal} onClose={closeConfirm} />

      {/* Topbar */}
      <div className="ap-topbar">
        <h1 className="ap-topbar-title">Commandes</h1>
        <button className="ac-btn-export" onClick={exportCSV} disabled={exporting}>
          {exporting ? "Export…" : "Export CSV"}
        </button>
      </div>

      {/* Toolbar — recherche + filtres + tri */}
      <div className="ao-toolbar-top">
        <input
          type="text"
          placeholder="Rechercher par nom, email, ville…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="ap-search-input"
        />
        <div className="ap-sort-wrap" ref={filterRef}>
          <button className="ap-sort-trigger" onClick={() => setFilterOpen(o => !o)}>
            <span className="ao-filter-dot" style={{ background: CHIP_FILTERS.find(f => f.value === statusFilter)?.color }} />
            {CHIP_FILTERS.find(f => f.value === statusFilter)?.label}
            <svg className={`ap-sort-trigger-arrow ${filterOpen ? "open" : ""}`} width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1.5 3.5L5 7L8.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {filterOpen && (
            <ul className="ap-sort-dropdown">
              <li className="ap-sort-dropdown-title">Filtrer par statut</li>
              {CHIP_FILTERS.map(f => {
                const count = stats ? (f.statsKey === "total" ? stats.total : stats[f.statsKey] ?? 0) : null;
                return (
                  <li
                    key={f.value}
                    className={`ap-sort-option ${statusFilter === f.value ? "selected" : ""}`}
                    onClick={() => { setStatusFilter(f.value); setFilterOpen(false); }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="ao-filter-dot" style={{ background: f.color }} />
                      {f.label}
                      {count !== null && <span style={{ color: "#a8a29e", fontSize: "11px" }}>({count})</span>}
                    </span>
                    {statusFilter === f.value && <span className="ap-sort-check">✓</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="ap-sort-wrap" ref={sortRef}>
          <button className="ap-sort-trigger" onClick={() => setSortOpen(o => !o)}>
            {SORT_OPTIONS.find(o => o.value === sort)?.label}
            <svg className={`ap-sort-trigger-arrow ${sortOpen ? "open" : ""}`} width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1.5 3.5L5 7L8.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {sortOpen && (
            <ul className="ap-sort-dropdown">
              <li className="ap-sort-dropdown-title">Trier par</li>
              {SORT_OPTIONS.map(o => (
                <li
                  key={o.value}
                  className={`ap-sort-option ${sort === o.value ? "selected" : ""}`}
                  onClick={() => { setSort(o.value); setSortOpen(false); }}
                >
                  {o.label}
                  {sort === o.value && <span className="ap-sort-check">✓</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="ap-table-wrap">
        {loading ? (
          <div className="admin-loading-wrap"><span className="admin-loader" />Chargement</div>
        ) : localOrders.length === 0 ? (
          <div className="ap-state"><span className="ap-state-icon">📭</span>Aucune commande trouvée</div>
        ) : (
          <table className="ap-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Contact</th>
                <th>Localisation</th>
                <th>Total</th>
                <th>Paiement</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {localOrders.map(o => {
                const c        = o.customer || {};
                const fullName = [c.firstname, c.lastname].filter(Boolean).join(" ") || c.name || "—";
                const initials = ((c.firstname?.[0] || "") + (c.lastname?.[0] || "")).toUpperCase() || "?";

                return (
                  <tr key={o._id}>
                    <td>
                      <div className="ao-client-cell">
                        <div className="ao-avatar">{initials}</div>
                        <span className="ao-client-name">{fullName}</span>
                      </div>
                    </td>
                    <td>
                      <div className="ao-contact">
                        {c.email && <a href={`mailto:${c.email}`} className="ao-email">{c.email}</a>}
                        {c.phone && <span className="ao-phone">{c.phone}</span>}
                      </div>
                    </td>
                    <td>
                      <div className="ao-location">
                        {c.city    && <span className="ao-city">{c.city}</span>}
                        {c.address && <span className="ao-address">{c.address}</span>}
                      </div>
                    </td>
                    <td>
                      <span className="ao-total">{(o.total || 0).toLocaleString()} €</span>
                    </td>
                    <td>
                      <span className={`ao-payment ao-payment-${o.payment}`}>
                        {PAYMENT_LABELS[o.payment] || o.payment || "—"}
                      </span>
                    </td>
                    <td>
                      <select
                        value={o.status}
                        disabled={updatingId === o._id}
                        onChange={e => updateStatus(o._id, e.target.value)}
                        className={`ao-status-select ao-status-${o.status}`}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className="ap-date">
                        {o.createdAt ? new Date(o.createdAt).toLocaleDateString("fr-FR") : "—"}
                      </span>
                    </td>
                    <td>
                      <div className="ap-actions">
                        <Link href={`/admin/orders/${o._id}`} className="ap-btn-view" title="Voir le détail">↗</Link>
                        <button className="ap-btn-delete" onClick={() => deleteOrder(o._id)}>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="ap-pagination">
          <button className="ap-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            Préc.
          </button>
          <span className="ap-page-info">
            Page {page} / {pagination.totalPages}
            <span className="ap-page-total"> — {pagination.total} commandes</span>
          </span>
          <button className="ap-page-btn" disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)}>
            Suiv.
          </button>
        </div>
      )}
    </div>
  );
}
