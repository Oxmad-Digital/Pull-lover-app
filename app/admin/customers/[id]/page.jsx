"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/app/hooks/useToast";
import { useConfirmDialog } from "@/app/hooks/useConfirmDialog";
import { Toast } from "@/app/components/ui/Toast";
import { ConfirmationDialog } from "@/app/components/ui/ConfirmationDialog";
import "./customer-detail.css";

const VIP_THRESHOLD = 50_000;

const ORDER_STATUS = {
  pending:    { label: "En attente",  cls: "s-pending"    },
  confirmed:  { label: "Confirmée",   cls: "s-confirmed"  },
  processing: { label: "En cours",    cls: "s-processing" },
  paid:       { label: "Payée",       cls: "s-paid"       },
  shipped:    { label: "Expédiée",    cls: "s-shipped"    },
  delivered:  { label: "Livrée",      cls: "s-delivered"  },
  cancelled:  { label: "Annulée",     cls: "s-cancelled"  },
};

export default function CustomerDetailPage() {
  const { id }   = useParams();
  const router   = useRouter();

  const [customer, setCustomer]         = useState(null);
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [editing, setEditing]           = useState(false);
  const [saving, setSaving]             = useState(false);
  const [sendingEmail, setSendingEmail] = useState(null);
  const [form, setForm] = useState({
    firstname: "", lastname: "", email: "",
    phone: "", city: "", address: "", notes: "",
  });

  const { toast, showToast }                    = useToast();
  const { confirmModal, askConfirm, closeConfirm } = useConfirmDialog();

  const loadCustomer = useCallback(async () => {
    try {
      const res  = await fetch(`/api/customers/${id}`);
      const data = await res.json();
      if (data.success) {
        setCustomer(data.customer);
        setOrders(data.orders || []);
        setForm({
          firstname: data.customer.firstname || "",
          lastname:  data.customer.lastname  || "",
          email:     data.customer.email     || "",
          phone:     data.customer.phone     || "",
          city:      data.customer.city      || "",
          address:   data.customer.address   || "",
          notes:     data.customer.notes     || "",
        });
      }
    } catch (err) {
      console.error(err);
      showToast("Erreur lors du chargement", "error");
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => { loadCustomer(); }, [loadCustomer]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res  = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) { setCustomer(data.customer); setEditing(false); showToast("Client mis à jour"); }
      else showToast("Erreur de sauvegarde", "error");
    } catch { showToast("Erreur de sauvegarde", "error"); }
    finally { setSaving(false); }
  };

  const toggleStatus = () => {
    const newStatus = customer.status === "active" ? "blocked" : "active";
    askConfirm(
      `Voulez-vous vraiment ${newStatus === "blocked" ? "bloquer" : "débloquer"} ${customer.firstname} ${customer.lastname} ?`,
      async () => {
        const res  = await fetch(`/api/customers/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        const data = await res.json();
        if (data.success) { setCustomer(data.customer); showToast(newStatus === "blocked" ? "Client bloqué" : "Client débloqué"); }
      },
      newStatus === "blocked" ? "Bloquer" : "Débloquer"
    );
  };

  const handleDelete = () => {
    if (orders.length > 0) {
      askConfirm(
        `Ce client a ${orders.length} commande(s). Il sera anonymisé conformément au RGPD plutôt que supprimé définitivement.`,
        () => confirmDelete("anonymize"),
        "Anonymiser"
      );
    } else {
      askConfirm(
        `Supprimer définitivement ${customer.firstname} ${customer.lastname} ? Cette action est irréversible.`,
        () => confirmDelete("delete"),
        "Supprimer"
      );
    }
  };

  const confirmDelete = async (action) => {
    try {
      const res  = await fetch(`/api/customers/${id}?action=${action}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { showToast("Action effectuée"); setTimeout(() => router.push("/admin/customers"), 1500); }
      else showToast("Erreur lors de la suppression", "error");
    } catch { showToast("Erreur lors de la suppression", "error"); }
  };

  const handleResendEmail = async (orderId) => {
    setSendingEmail(orderId);
    try {
      const res  = await fetch(`/api/orders/${orderId}/resend-email`, { method: "POST" });
      const data = await res.json();
      if (data.success) showToast("Email de facture renvoyé");
      else showToast("Erreur : " + data.message, "error");
    } catch { showToast("Impossible de contacter le serveur", "error"); }
    finally { setSendingEmail(null); }
  };

  const formatLastOrder = (date) => {
    if (!date) return null;
    const days = Math.floor((Date.now() - new Date(date)) / 86_400_000);
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Hier";
    if (days < 7)   return `Il y a ${days}j`;
    if (days < 30)  return `Il y a ${Math.floor(days / 7)} sem`;
    return new Date(date).toLocaleDateString("fr-FR");
  };

  const field = (key, label, type = "text") => (
    <div className="acd-field">
      <label className="acd-field-label">{label}</label>
      <input
        type={type}
        className="acd-field-input"
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
      />
    </div>
  );

  if (loading) return (
    <div className="acd-page">
      <div className="admin-loading-wrap"><span className="admin-loader" /></div>
    </div>
  );
  if (!customer) return (
    <div className="acd-page">
      <div className="acd-state">Client non trouvé</div>
    </div>
  );

  const isAnonymized = customer.status === "deleted";
  const isVip        = (customer.totalSpent || 0) >= VIP_THRESHOLD;
  const status       = customer.status === "active" ? "ok" : customer.status === "blocked" ? "blocked" : "anon";
  const address      = [customer.address, customer.city].filter(Boolean).join(" · ");

  return (
    <div className="acd-page">

      <Toast toast={toast} />
      <ConfirmationDialog confirmModal={confirmModal} onClose={closeConfirm} />

      {/* Topbar */}
      <div className="acd-topbar">
        <Link href="/admin/customers" className="acd-back-btn">← Retour</Link>
        <div className="acd-topbar-center">
          <h1 className="acd-fullname">
            {customer.firstname} {customer.lastname}
            {isVip && <span className="acd-vip">VIP</span>}
          </h1>
          <span className="acd-subtitle">
            Client depuis le {new Date(customer.createdAt).toLocaleDateString("fr-FR", { dateStyle: "long" })}
          </span>
        </div>
        <span className={`acd-status-badge ${status}`}>
          {status === "ok" ? "Actif" : status === "blocked" ? "Bloqué" : "Anonymisé"}
        </span>
      </div>

      <div className="acd-layout">

        {/* ── Colonne principale ── */}
        <div className="acd-main-col">

          {/* Informations */}
          <div className="acd-card">
            <div className="acd-card-head">
              <h2 className="acd-card-title">Informations</h2>
              {!isAnonymized && !editing && (
                <button className="acd-edit-link" onClick={() => setEditing(true)}>Modifier</button>
              )}
            </div>

            {editing ? (
              <div className="acd-form">
                <div className="acd-form-row">
                  {field("firstname", "Prénom")}
                  {field("lastname",  "Nom")}
                </div>
                <div className="acd-form-row">
                  {field("email", "Email",     "email")}
                  {field("phone", "Téléphone", "tel")}
                </div>
                <div className="acd-form-row">
                  {field("address", "Adresse")}
                  {field("city",    "Ville")}
                </div>
                <div className="acd-field">
                  <label className="acd-field-label">Notes admin</label>
                  <textarea
                    className="acd-field-input acd-textarea"
                    rows={3}
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </div>
                <div className="acd-form-actions">
                  <button className="acd-btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? "Enregistrement…" : "Enregistrer"}
                  </button>
                  <button className="acd-btn-ghost" onClick={() => setEditing(false)}>Annuler</button>
                </div>
              </div>
            ) : (
              <div className="acd-info-grid">
                <div>
                  <span className="acd-field-label">Email</span>
                  {customer.email
                    ? <a href={`mailto:${customer.email}`} className="acd-link">{customer.email}</a>
                    : <span className="acd-field-value">—</span>}
                </div>
                <div>
                  <span className="acd-field-label">Téléphone</span>
                  <span className="acd-field-value">{customer.phone || "—"}</span>
                </div>
                <div className="acd-info-wide">
                  <span className="acd-field-label">Adresse</span>
                  <span className="acd-field-value">{address || "—"}</span>
                </div>
                {customer.notes && (
                  <div className="acd-info-wide">
                    <span className="acd-field-label">Notes admin</span>
                    <span className="acd-field-value acd-notes">{customer.notes}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Historique des commandes */}
          <div className="acd-card">
            <h2 className="acd-card-title">
              Historique des commandes
              {orders.length > 0 && <span className="acd-count">{orders.length}</span>}
            </h2>
            {orders.length === 0 ? (
              <div className="acd-empty">Aucune commande enregistrée</div>
            ) : (
              <div className="acd-table-wrap">
                <table className="acd-table">
                  <thead>
                    <tr>
                      <th>N°</th>
                      <th>Date</th>
                      <th>Statut</th>
                      <th>Total</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => {
                      const s = ORDER_STATUS[order.status] || { label: order.status, cls: "s-pending" };
                      return (
                        <tr key={order._id}>
                          <td>
                            <Link href={`/admin/orders/${order._id}`} className="acd-order-id">
                              #{order._id.slice(-8).toUpperCase()}
                            </Link>
                          </td>
                          <td>{new Date(order.createdAt).toLocaleDateString("fr-FR")}</td>
                          <td><span className={`acd-order-badge ${s.cls}`}>{s.label}</span></td>
                          <td className="acd-order-total">{(order.total || 0).toLocaleString()} €</td>
                          <td className="acd-actions">
                            <button
                              className="acd-btn-ghost acd-btn-sm"
                              onClick={() => handleResendEmail(order._id)}
                              disabled={sendingEmail === order._id}
                              title="Renvoyer la facture par email"
                            >
                              {sendingEmail === order._id ? "Envoi…" : "Renvoyer la facture"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Colonne latérale ── */}
        <div className="acd-side-col">

          {/* Statistiques */}
          <div className="acd-card">
            <h2 className="acd-card-title">Statistiques</h2>
            <div className="acd-summary-row">
              <span className="acd-summary-label">Commandes</span>
              <span className="acd-summary-value">{customer.totalOrders || 0}</span>
            </div>
            <div className="acd-summary-row">
              <span className="acd-summary-label">Dernière commande</span>
              <span
                className="acd-summary-value"
                title={customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleDateString("fr-FR") : undefined}
              >
                {formatLastOrder(customer.lastOrderAt) || "—"}
              </span>
            </div>
            <div className="acd-summary-row acd-summary-total">
              <span className="acd-summary-label">Total dépensé</span>
              <span className="acd-total-value">{(customer.totalSpent || 0).toLocaleString()} €</span>
            </div>
          </div>

          {/* Actions */}
          {!isAnonymized && (
            <div className="acd-card">
              <h2 className="acd-card-title">Actions</h2>
              <div className="acd-side-actions">
                <button className="acd-btn-ghost" onClick={toggleStatus}>
                  {customer.status === "active" ? "Bloquer le client" : "Débloquer le client"}
                </button>
                <button className="acd-btn-danger" onClick={handleDelete}>
                  {orders.length > 0 ? "Anonymiser le client" : "Supprimer le client"}
                </button>
              </div>
              <p className="acd-hint">
                {orders.length > 0
                  ? "Un client ayant des commandes est anonymisé (RGPD) plutôt que supprimé."
                  : "La suppression est définitive."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
