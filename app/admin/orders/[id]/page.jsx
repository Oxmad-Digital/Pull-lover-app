"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/app/hooks/useToast";
import { Toast } from "@/app/components/ui/Toast";
import { deliveryLabel } from "@/app/lib/shipping-label";
import "./order-detail.css";

const STATUS_OPTIONS = [
  { value: "pending",    label: "En attente"     },
  { value: "confirmed",  label: "Confirmée"      },
  { value: "processing", label: "En préparation" },
  { value: "paid",       label: "Payée"          },
  { value: "shipped",    label: "Expédiée"       },
  { value: "delivered",  label: "Livrée"         },
  { value: "cancelled",  label: "Annulée"        },
];

// Étapes du parcours normal d'une commande (hors annulation, traitée à part)
const MAIN_STATUSES = STATUS_OPTIONS.filter(s => s.value !== "cancelled");

const PAYMENT_LABELS = {
  cash:          "Espèces",
  mobile_money:  "Mobile Money",
  card:          "Carte bancaire",
  bank_transfer: "Virement bancaire",
};

const money = (n) => `${(Number(n) || 0).toFixed(2)} €`;

export default function AdminOrderDetailPage() {
  const { id }   = useParams();
  const router   = useRouter();
  const [order, setOrder]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [updating, setUpdating]       = useState(false);
  const [generatingLabel, setGeneratingLabel] = useState(false);
  const { toast, showToast } = useToast();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/admin/orders/${id}`);
        if (!res.ok) { router.push("/admin/orders"); return; }
        const data = await res.json();
        setOrder(data);
      } catch {
        router.push("/admin/orders");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id, router]);

  const generateLabel = async () => {
    setGeneratingLabel(true);
    try {
      let res  = await fetch(`/api/admin/orders/${id}/label`, { method: "POST" });
      let data = await res.json();
      // 423 = période de drop en cours : l'envoi au transporteur demande une confirmation explicite
      if (res.status === 423) {
        if (!window.confirm(`${data.message}\n\nEnvoyer quand même cette commande au transporteur maintenant ?`)) return;
        res  = await fetch(`/api/admin/orders/${id}/label`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ force: true }),
        });
        data = await res.json();
      }
      if (!res.ok) { showToast(data.message || "Erreur", "error"); return; }
      setOrder(data.order);
      showToast(`Étiquette générée — Suivi : ${data.trackingNumber}`);
    } catch {
      showToast("Erreur serveur", "error");
    } finally {
      setGeneratingLabel(false);
    }
  };

  const updateStatus = async (newStatus) => {
    if (!order || newStatus === order.status) return;
    if (newStatus === "cancelled" && !window.confirm("Annuler cette commande ? Un email sera envoyé au client.")) return;
    setUpdating(true);
    try {
      const res  = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message || "Erreur", "error"); return; }
      setOrder(data);
      showToast("Statut mis à jour — email envoyé au client");
    } catch {
      showToast("Erreur serveur", "error");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="od-page">
        <div className="admin-loading-wrap"><span className="admin-loader" /></div>
      </div>
    );
  }

  if (!order) return null;

  const c           = order.customer || {};
  const fullName    = [c.firstname, c.lastname].filter(Boolean).join(" ") || "—";
  const initials    = ((c.firstname?.[0] || "") + (c.lastname?.[0] || "")).toUpperCase() || "?";
  const orderNumber = order._id.toString().slice(-8).toUpperCase();

  const isCancelled  = order.status === "cancelled";
  const currentIndex = MAIN_STATUSES.findIndex(s => s.value === order.status);

  // Source des lignes : "lines" (snapshot avec prix) si présent, sinon "products" (populate, sans prix)
  const items = order.lines?.length
    ? order.lines
    : (order.products || []).map(p => ({
        product:   p.product?._id,
        name:      p.product?.name,
        image:     p.product?.image,
        quantity:  p.quantity,
        unitPrice: null,
      }));

  return (
    <div className="od-page">

      <Toast toast={toast} />

      {/* Topbar */}
      <div className="od-topbar">
        <Link href="/admin/orders" className="od-back-btn">← Retour</Link>
        <div className="od-topbar-center">
          <h1 className="od-title">Commande <span className="od-ref">#{orderNumber}</span></h1>
          {order.createdAt && (
            <span className="od-date-top">
              {new Date(order.createdAt).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}
            </span>
          )}
        </div>
        <span className={`ao-status-badge ao-status-${order.status}`}>
          {STATUS_OPTIONS.find(s => s.value === order.status)?.label || order.status}
        </span>
      </div>

      {/* ── Statut de la commande ── */}
      <div className="od-card od-stepper-card">
        <div className="od-stepper-head">
          <h2 className="od-card-title">Statut de la commande</h2>
          {!isCancelled && (
            <button
              className="od-cancel-link"
              disabled={updating}
              onClick={() => updateStatus("cancelled")}
            >
              ✕ Annuler la commande
            </button>
          )}
        </div>

        {isCancelled && (
          <div className="od-cancelled-banner">
            Cette commande a été annulée.
            <button
              className="od-reactivate-link"
              disabled={updating}
              onClick={() => updateStatus("pending")}
            >
              Réactiver
            </button>
          </div>
        )}

        <div className={`od-stepper ${isCancelled ? "od-stepper-muted" : ""}`}>
          {MAIN_STATUSES.map((s, i) => {
            const state = isCancelled ? "todo" : i < currentIndex ? "done" : i === currentIndex ? "current" : "todo";
            return (
              <button
                key={s.value}
                className={`od-step od-step-${state}`}
                disabled={updating}
                onClick={() => updateStatus(s.value)}
              >
                <span className="od-step-dot">{state === "done" ? "✓" : i + 1}</span>
                <span className="od-step-label">{s.label}</span>
              </button>
            );
          })}
        </div>

        <p className="od-status-hint">Cliquez sur une étape pour la mettre à jour — un email est envoyé automatiquement au client.</p>
      </div>

      <div className="od-layout">

        {/* ── Colonne principale ── */}
        <div className="od-main-col">

          {/* Client */}
          <div className="od-card">
            <h2 className="od-card-title">Client</h2>
            <div className="od-client-row">
              <div className="od-avatar">{initials}</div>
              <div className="od-client-name">{fullName}</div>
            </div>
            <div className="od-client-grid">
              <div className="od-client-field">
                <span className="od-field-label">Email</span>
                {c.email
                  ? <a href={`mailto:${c.email}`} className="od-client-email">{c.email}</a>
                  : <span className="od-field-value">—</span>}
              </div>
              <div className="od-client-field">
                <span className="od-field-label">Téléphone</span>
                <span className="od-field-value">{c.phone || "—"}</span>
              </div>
              <div className="od-client-field od-client-field-wide">
                <span className="od-field-label">Adresse de livraison</span>
                <span className="od-field-value">
                  {c.address || c.city
                    ? [c.address, [c.postalCode, c.city].filter(Boolean).join(" ")].filter(Boolean).join(" · ")
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Articles commandés */}
          {items.length > 0 && (
            <div className="od-card od-products-card">
              <h2 className="od-card-title">Articles commandés</h2>
              <table className="od-products-table">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Prix unit.</th>
                    <th>Qté</th>
                    <th>Sous-total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => {
                    const qty       = item.quantity || 1;
                    const unitPrice = item.unitPrice;
                    const lineTotal = unitPrice != null ? unitPrice * qty : null;
                    const variant   = [item.size, item.color].filter(Boolean).join(" · ");
                    return (
                      <tr key={i}>
                        <td>
                          <div className="od-product-cell">
                            {item.image
                              ? <Image src={item.image} alt={item.name || ""} width={44} height={44} className="od-product-img" />
                              : <div className="od-product-no-img">👕</div>
                            }
                            <div>
                              <div className="od-product-name">{item.name || "Produit supprimé"}</div>
                              {variant && <div className="od-product-variant">{variant}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="od-product-price">{unitPrice != null ? money(unitPrice) : "—"}</td>
                        <td className="od-product-qty">× {qty}</td>
                        <td className="od-product-subtotal">{lineTotal != null ? money(lineTotal) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  {order.discountAmount > 0 && (
                    <tr className="od-products-discount-row">
                      <td colSpan={3}>Réduction{order.promoCode ? ` (${order.promoCode})` : ""}</td>
                      <td>−{money(order.discountAmount)}</td>
                    </tr>
                  )}
                  <tr className="od-products-total-row">
                    <td colSpan={3}>Total commande</td>
                    <td>{money(order.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Expédition */}
          <div className="od-card">
            <h2 className="od-card-title">Expédition</h2>

            {order.delivery?.method && (
              <div className="od-summary-row" style={{ marginBottom: 12 }}>
                <span className="od-summary-label">Mode</span>
                <span className="od-summary-value">
                  {deliveryLabel(order.delivery) || order.delivery.methodName || order.delivery.method}
                </span>
              </div>
            )}

            {order.delivery?.servicePoint && (
              <div className="od-summary-row" style={{ marginBottom: 12 }}>
                <span className="od-summary-label">Point relais</span>
                <span className="od-summary-value">
                  {order.delivery.servicePoint.name} — {order.delivery.servicePoint.street}, {order.delivery.servicePoint.postalCode} {order.delivery.servicePoint.city}
                </span>
              </div>
            )}

            {order.delivery?.trackingNumber ? (
              <>
                <div className="od-summary-row" style={{ marginBottom: 12 }}>
                  <span className="od-summary-label">N° de suivi</span>
                  <span className="od-tracking-number">{order.delivery.trackingNumber}</span>
                </div>

                {order.delivery.shippedAt && (
                  <div className="od-summary-row" style={{ marginBottom: 12 }}>
                    <span className="od-summary-label">Expédiée le</span>
                    <span className="od-summary-value">
                      {new Date(order.delivery.shippedAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </div>
                )}

                <div className="od-shipping-actions">
                  <a
                    href={order.delivery.trackingUrl || `https://www.laposte.fr/outils/suivre-vos-envois?code=${order.delivery.trackingNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="od-btn od-btn-primary"
                  >
                    Suivre le colis →
                  </a>

                  {order.delivery.labelUrl && (
                    <a
                      href={order.delivery.labelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="od-btn od-btn-secondary"
                    >
                      Télécharger l&apos;étiquette PDF
                    </a>
                  )}
                </div>
              </>
            ) : (
              <div>
                <p className="od-shipping-hint">
                  Aucune étiquette générée. Cliquez ci-dessous pour créer l&apos;étiquette via SendCloud et passer la commande en <em>Expédiée</em>.
                  {order.delivery?.releaseAt && new Date(order.delivery.releaseAt) > new Date() && (
                    <strong className="od-shipping-warning">
                      Période de drop : envoi au transporteur prévu à partir du {new Date(order.delivery.releaseAt).toLocaleDateString("fr-FR")}.
                    </strong>
                  )}
                </p>
                <button
                  onClick={generateLabel}
                  disabled={generatingLabel || order.status === "cancelled" || order.status === "delivered"}
                  className="od-btn od-btn-generate"
                >
                  {generatingLabel ? "Génération en cours…" : "Générer l'étiquette"}
                </button>
              </div>
            )}
          </div>

        </div>

        {/* ── Colonne latérale ── */}
        <div className="od-side-col">
          <div className="od-card od-summary-card">
            <h2 className="od-card-title">Résumé</h2>
            <div className="od-summary-row">
              <span className="od-summary-label">Statut</span>
              <span className={`ao-status-badge ao-status-${order.status}`}>
                {STATUS_OPTIONS.find(s => s.value === order.status)?.label || order.status}
              </span>
            </div>
            <div className="od-summary-row">
              <span className="od-summary-label">Paiement</span>
              <span className={`ao-payment ao-payment-${order.payment}`}>
                {PAYMENT_LABELS[order.payment] || order.payment || "—"}
              </span>
            </div>
            <div className="od-summary-row">
              <span className="od-summary-label">Articles</span>
              <span className="od-summary-value">{order.products?.length || 0}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="od-summary-row">
                <span className="od-summary-label">Réduction</span>
                <span className="od-summary-value">−{money(order.discountAmount)}</span>
              </div>
            )}
            <div className="od-summary-row od-summary-total">
              <span className="od-summary-label">Total</span>
              <span className="od-total-value">{money(order.total)}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
