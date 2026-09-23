import { getServerSession } from "next-auth";
import type { AuthOptions } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { connectDB } from "@/app/lib/db";
import Order from "@/app/models/Order";
import Link from "next/link";

const STATUS_STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"] as const;

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string; color: string }> = {
  pending:    { label: "En attente",      badgeClass: "db-badge db-badge-pending",    color: "#f59e0b" },
  confirmed:  { label: "Confirmée",       badgeClass: "db-badge db-badge-confirmed",  color: "#3b82f6" },
  processing: { label: "En préparation",  badgeClass: "db-badge db-badge-processing", color: "#8b5cf6" },
  paid:       { label: "Payée",           badgeClass: "db-badge db-badge-paid",       color: "#10b981" },
  shipped:    { label: "Expédiée",        badgeClass: "db-badge db-badge-shipped",    color: "#06b6d4" },
  delivered:  { label: "Livrée",         badgeClass: "db-badge db-badge-delivered",  color: "#22c55e" },
  cancelled:  { label: "Annulée",        badgeClass: "db-badge db-badge-cancelled",  color: "#ef4444" },
};

const PAYMENT_LABELS: Record<string, string> = {
  cash:           "Espèces à la livraison",
  mobile_money:   "Mobile Money",
  card:           "Carte bancaire",
  bank_transfer:  "Virement bancaire",
};

export default async function OrdersPage() {
  const session = await getServerSession(authOptions as AuthOptions);
  if (!session?.user) redirect("/auth/login");

  await connectDB();

  const orders = await Order.find({ "customer.email": session.user.email })
    .populate("products.product", "name price")
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  return (
    <div>
      <h1 className="db-page-title">Mes commandes</h1>

      <div className="db-wrapper">
        {orders.length === 0 ? (
          <div className="db-card" style={{ textAlign: "center", padding: "48px 24px" }}>
            <p style={{ fontSize: 14, color: "#888", marginBottom: 16 }}>
              Vous n&apos;avez pas encore de commandes.
            </p>
            <Link href="/#piece" className="db-add-address" style={{ display: "inline-flex" }}>
              Découvrir le Mantasoa
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order: any) => {
              const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const currentStep = order.status === "cancelled"
                ? -1
                : STATUS_STEPS.indexOf(order.status as any);

              return (
                <div key={order._id} className="order-card">

                  {/* Header */}
                  <div className="order-card-header">
                    <div>
                      <span className="order-card-id">
                        #{order._id.toString().slice(-6).toUpperCase()}
                      </span>
                      <span className="order-card-date">
                        {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <span className={status.badgeClass}>{status.label}</span>
                  </div>

                  <div className="order-card-body">

                    {/* Timeline */}
                    {order.status !== "cancelled" && (
                      <div className="order-timeline">
                        {STATUS_STEPS.map((step, index) => {
                          const stepConf = STATUS_CONFIG[step];
                          const isActive = index <= currentStep;
                          const isCurrent = index === currentStep;

                          return (
                            <div key={step} className="timeline-step">
                              <div
                                className="timeline-dot"
                                style={{
                                  backgroundColor: isActive ? stepConf.color : "#e5e7eb",
                                  transform: isCurrent ? "scale(1.2)" : "scale(1)",
                                  transition: "all 0.2s ease",
                                }}
                              >
                                {isActive && (
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                )}
                              </div>
                              {index < STATUS_STEPS.length - 1 && (
                                <div
                                  className="timeline-line"
                                  style={{ backgroundColor: index < currentStep ? "#22c55e" : "#e5e7eb" }}
                                />
                              )}
                              <span
                                className="timeline-label"
                                style={{
                                  color: isActive ? "#111" : "#9ca3af",
                                  fontWeight: isCurrent ? 700 : 400,
                                }}
                              >
                                {stepConf.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Annulée */}
                    {order.status === "cancelled" && (
                      <div className="order-cancelled-banner">
                        Commande annulée
                      </div>
                    )}

                    {/* Produits */}
                    <div className="order-products">
                      {order.products?.map((item: any, idx: number) => (
                        <div key={idx} className="order-product-row">
                          <span>{item.product?.name || "Produit"}</span>
                          <span style={{ color: "#888" }}>× {item.quantity}</span>
                        </div>
                      ))}
                      <div className="order-total-row">
                        <span>Total</span>
                        <span style={{ color: "#c0616a" }}>
                          {Number(order.total).toLocaleString("fr-FR")} €
                        </span>
                      </div>
                    </div>

                    {/* Suivi Colissimo */}
                    {(order.status === "shipped" || order.status === "delivered") && (order as any).delivery?.trackingNumber && (
                      <div style={{
                        marginTop: 16,
                        padding: "14px 16px",
                        background: "#f0fafe",
                        border: "1px solid #bae6fd",
                        borderRadius: 8,
                      }}>
                        <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#0369a1", letterSpacing: "1px", textTransform: "uppercase" }}>
                          Suivi Colissimo
                        </p>
                        <p style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 800, color: "#0c4a6e", letterSpacing: "1.5px" }}>
                          {(order as any).delivery.trackingNumber}
                        </p>
                        {(order as any).delivery.shippedAt && (
                          <p style={{ margin: "0 0 10px", fontSize: 12, color: "#475569" }}>
                            Expédiée le {new Date((order as any).delivery.shippedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                        )}
                        <a
                          href={`https://www.laposte.fr/outils/suivre-vos-envois?code=${(order as any).delivery.trackingNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex", alignItems: "center",
                            padding: "7px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                            background: "#0ea5e9", color: "#fff", textDecoration: "none",
                          }}
                        >
                          Suivre mon colis →
                        </a>
                      </div>
                    )}

                    {/* Infos livraison */}
                    <div style={{
                      marginTop: 16,
                      paddingTop: 14,
                      borderTop: "1px solid #f0f0f0",
                      display: "flex",
                      gap: 32,
                      flexWrap: "wrap",
                      fontSize: 13,
                      color: "#555",
                    }}>
                      {order.customer?.address && (
                        <span>
                          <strong style={{ color: "#243B3B" }}>Adresse : </strong>
                          {order.customer.address}, {order.customer.city}
                        </span>
                      )}
                      {order.payment && (
                        <span>
                          <strong style={{ color: "#243B3B" }}>Paiement : </strong>
                          {PAYMENT_LABELS[order.payment] || order.payment}
                        </span>
                      )}
                      {(order as any).delivery?.method && (
                        <span>
                          <strong style={{ color: "#243B3B" }}>Livraison : </strong>
                          {(order as any).delivery.method === "colissimo_relais" ? "Point relais Colissimo" : "Colissimo domicile"}
                        </span>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
