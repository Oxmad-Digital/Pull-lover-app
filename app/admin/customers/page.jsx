"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useToast } from "@/app/hooks/useToast";
import { useConfirmDialog } from "@/app/hooks/useConfirmDialog";
import { useClickOutside } from "@/app/hooks/useClickOutside";
import { usePaginatedFetch } from "@/app/hooks/usePaginatedFetch";
import { Toast } from "@/app/components/ui/Toast";
import { ConfirmationDialog } from "@/app/components/ui/ConfirmationDialog";
import "./customers.css";

const VIP_THRESHOLD = 50_000;
const PER_PAGE = 25;

const CHIP_FILTERS = [
  { value: "all",     label: "Tous",    color: "#252323" },
  { value: "active",  label: "Actifs",  color: "#15803d" },
  { value: "blocked", label: "Bloqués", color: "#be123c" },
  { value: "vip",     label: "VIP",     color: "#f59e0b" },
];

const SORT_OPTIONS = [
  { label: "Date inscription",  value: "createdAt"   },
  { label: "Dernière commande", value: "lastOrderAt" },
  { label: "Commandes",         value: "totalOrders" },
  { label: "Total dépensé",     value: "totalSpent"  },
];

export default function CustomersPage() {
  const [search, setSearch]                   = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter]       = useState("all");
  const [sort, setSort]                       = useState("createdAt");
  const [sortDir, setSortDir]                 = useState("desc");
  const [syncing, setSyncing]                 = useState(false);
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
    ...(statusFilter === "vip"                        && { vip: "true" }),
    ...(statusFilter !== "all" && statusFilter !== "vip" && { status: statusFilter }),
  };

  const { items: customers, pagination, loading, page, setPage } =
    usePaginatedFetch("/api/customers", queryParams, { itemsKey: "customers", perPage: PER_PAGE });

  // Mutation locale sur les customers (toggle statut, suppression)
  const [localCustomers, setLocalCustomers] = useState([]);
  useEffect(() => { setLocalCustomers(customers); }, [customers]);

  const exportCSV = async () => {
    setExporting(true);
    try {
      const p = new URLSearchParams({ sort, order: sortDir, limit: "9999" });
      if (debouncedSearch) p.append("search", debouncedSearch);
      if (statusFilter === "vip") p.append("vip", "true");
      else if (statusFilter && statusFilter !== "all") p.append("status", statusFilter);

      const res  = await fetch(`/api/customers?${p}`);
      const data = await res.json();
      if (!data.success) return;

      const headers = [
        "Prénom", "Nom", "Email", "Téléphone", "Ville",
        "Commandes", "Total dépensé (€)", "Dernière commande", "Statut", "Inscrit le",
      ];
      const rows = data.customers.map(c => [
        c.firstname, c.lastname, c.email, c.phone || "", c.city || "",
        c.totalOrders, c.totalSpent || 0,
        c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString("fr-FR") : "",
        c.status === "active" ? "Actif" : "Bloqué",
        new Date(c.createdAt).toLocaleDateString("fr-FR"),
      ].join(";"));

      const csv  = [headers.join(";"), ...rows].join("\n");
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `clients_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const syncFromOrders = () => {
    askConfirm(
      "Synchroniser les clients depuis les commandes existantes ?",
      async () => {
        setSyncing(true);
        try {
          const res  = await fetch("/api/customers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "sync" }),
          });
          const data = await res.json();
          if (data.success) { showToast(data.message || "Synchronisation terminée"); setPage(1); }
          else showToast("Erreur lors de la synchronisation", "error");
        } catch { showToast("Erreur lors de la synchronisation", "error"); }
        finally { setSyncing(false); }
      },
      "Synchroniser"
    );
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "blocked" : "active";
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setLocalCustomers(prev => prev.map(c => c._id === id ? { ...c, status: newStatus } : c));
        showToast(newStatus === "blocked" ? "Client bloqué" : "Client débloqué");
      }
    } catch { showToast("Erreur lors de la mise à jour", "error"); }
  };

  const deleteCustomer = (id, name) => {
    askConfirm(
      `Supprimer le client "${name}" définitivement ?`,
      async () => {
        try {
          const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
          if (res.ok) {
            setLocalCustomers(prev => prev.filter(c => c._id !== id));
            showToast("Client supprimé");
          } else showToast("Erreur lors de la suppression", "error");
        } catch { showToast("Erreur lors de la suppression", "error"); }
      },
      "Supprimer"
    );
  };

  const formatLastOrder = (date) => {
    if (!date) return null;
    const days = Math.floor((Date.now() - new Date(date)) / 86_400_000);
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Hier";
    if (days < 7)  return `Il y a ${days}j`;
    if (days < 30) return `Il y a ${Math.floor(days / 7)}sem`;
    if (days < 365) return `Il y a ${Math.floor(days / 30)} mois`;
    return new Date(date).toLocaleDateString("fr-FR");
  };

  const pageNumbers = (() => {
    const total = pagination.totalPages;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const set = new Set([1, total, page, page - 1, page + 1].filter(p => p >= 1 && p <= total));
    return [...set].sort((a, b) => a - b).reduce((acc, p, i, arr) => {
      if (i > 0 && p - arr[i - 1] > 1) acc.push("…");
      acc.push(p);
      return acc;
    }, []);
  })();

  return (
    <div className="ap-page">

      <Toast toast={toast} />
      <ConfirmationDialog confirmModal={confirmModal} onClose={closeConfirm} />

      {/* Topbar */}
      <div className="ap-topbar">
        <h1 className="ap-topbar-title">Utilisateurs</h1>
        <button className="ac-btn-export" onClick={exportCSV} disabled={exporting}>
          {exporting ? "Export…" : "Export CSV"}
        </button>
        <button className="ap-btn-add" onClick={syncFromOrders} disabled={syncing}>
          {syncing ? "Synchronisation…" : "Sync commandes"}
        </button>
      </div>

      {/* Toolbar — recherche + filtres + tri */}
      <div className="ao-toolbar-top">
        <input
          type="text"
          placeholder="Rechercher par nom, email, téléphone…"
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
              {CHIP_FILTERS.map(f => (
                <li
                  key={f.value}
                  className={`ap-sort-option ${statusFilter === f.value ? "selected" : ""}`}
                  onClick={() => { setStatusFilter(f.value); setFilterOpen(false); }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="ao-filter-dot" style={{ background: f.color }} />
                    {f.label}
                    {statusFilter === f.value && (
                      <span style={{ color: "#a8a29e", fontSize: "11px" }}>({pagination.total})</span>
                    )}
                  </span>
                  {statusFilter === f.value && <span className="ap-sort-check">✓</span>}
                </li>
              ))}
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
        ) : localCustomers.length === 0 ? (
          <div className="ap-state">
            <span className="ap-state-icon">📭</span>
            Aucun client trouvé
            <button className="ac-sync-empty" onClick={syncFromOrders} disabled={syncing}>
              Importer depuis les commandes
            </button>
          </div>
        ) : (
          <>
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Contact</th>
                  <th>Ville</th>
                  <th>Dernière commande</th>
                  <th>Commandes</th>
                  <th>Total dépensé</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {localCustomers.map(customer => (
                  <tr key={customer._id}>
                    <td>
                      <div className="ac-customer-cell">
                        <div className="ac-avatar">
                          {customer.firstname?.charAt(0)}{customer.lastname?.charAt(0)}
                        </div>
                        <div>
                          <div className="ac-customer-name-row">
                            <span className="ac-customer-name">
                              {customer.firstname} {customer.lastname}
                            </span>
                            {(customer.totalSpent || 0) >= VIP_THRESHOLD && (
                              <span className="ac-vip-badge">VIP</span>
                            )}
                          </div>
                          <span className="ac-customer-date">
                            Inscrit le {new Date(customer.createdAt).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="ac-contact">
                        <a href={`mailto:${customer.email}`} className="ac-email-link">{customer.email}</a>
                        {customer.phone && <span>{customer.phone}</span>}
                      </div>
                    </td>
                    <td className="ac-city">
                      {customer.city || <span className="ac-empty">—</span>}
                    </td>
                    <td>
                      {customer.lastOrderAt ? (
                        <span
                          className="ac-last-order"
                          title={new Date(customer.lastOrderAt).toLocaleDateString("fr-FR")}
                        >
                          {formatLastOrder(customer.lastOrderAt)}
                        </span>
                      ) : (
                        <span className="ac-empty">—</span>
                      )}
                    </td>
                    <td>
                      <span className="ac-orders-badge">{customer.totalOrders}</span>
                    </td>
                    <td>
                      <span className="ac-total-spent">
                        {(customer.totalSpent || 0).toLocaleString()} €
                      </span>
                    </td>
                    <td>
                      <span className={`ap-badge ${customer.status === "active" ? "ap-badge-ok" : "ap-badge-out"}`}>
                        {customer.status === "active" ? "Actif" : "Bloqué"}
                      </span>
                    </td>
                    <td>
                      <div className="ap-actions">
                        <Link href={`/admin/customers/${customer._id}`} className="ap-btn-view" title="Voir le profil">↗</Link>
                        <button
                          className={customer.status === "active" ? "ap-btn-edit" : "ac-btn-unblock"}
                          onClick={() => toggleStatus(customer._id, customer.status)}
                        >
                          {customer.status === "active" ? "Bloquer" : "Débloquer"}
                        </button>
                        <button
                          className="ap-btn-delete"
                          onClick={() => deleteCustomer(customer._id, `${customer.firstname} ${customer.lastname}`)}
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="ac-pagination">
                <button className="ac-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  Préc.
                </button>
                <div className="ac-page-numbers">
                  {pageNumbers.map((item, i) =>
                    item === "…" ? (
                      <span key={`el-${i}`} className="ac-page-ellipsis">…</span>
                    ) : (
                      <button
                        key={item}
                        className={`ac-page-num ${item === page ? "active" : ""}`}
                        onClick={() => setPage(item)}
                      >
                        {item}
                      </button>
                    )
                  )}
                </div>
                <button className="ac-page-btn" disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)}>
                  Suiv.
                </button>
                <span className="ac-page-info">
                  {((page - 1) * PER_PAGE) + 1}–{Math.min(page * PER_PAGE, pagination.total)} / {pagination.total}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
