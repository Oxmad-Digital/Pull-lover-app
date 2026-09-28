import { getServerSession } from "next-auth";
import type { AuthOptions } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import { redirect } from "next/navigation";
import { connectDB } from "@/app/lib/db";
import Order from "@/app/models/Order";
import Link from "next/link";
import { orderEmailFilter } from "@/app/lib/text";
import { INTL_LOCALE, localePath, toLocale } from "@/app/i18n/config.mjs";
import { formatMoney } from "@/app/i18n/format.mjs";
import { orderStatusLabel, paymentLabel } from "@/app/i18n/orders.mjs";
import { localizeProduct } from "@/app/i18n/product.mjs";

// Étapes affichées au client. Les commandes Stripe sont créées directement au statut "paid".
const STATUS_STEPS = ["paid", "processing", "shipped", "delivered"] as const;

// Position de chaque statut dans la timeline ("pending" = pas encore payée : aucune étape atteinte)
const STEP_INDEX: Record<string, number> = {
  pending: -1,
  confirmed: 0,
  paid: 0,
  processing: 1,
  shipped: 2,
  delivered: 3,
};

const STATUS_COLORS: Record<string, string> = {
  pending:    "#f59e0b",
  confirmed:  "#3b82f6",
  processing: "#8b5cf6",
  paid:       "#10b981",
  shipped:    "#06b6d4",
  delivered:  "#22c55e",
  cancelled:  "#ef4444",
};

const TEXT = {
  fr: {
    title: "Mes commandes",
    empty: "Vous n'avez pas encore de commandes.",
    discover: "Découvrir le cardigan",
    cancelled: "Commande annulée",
    product: "Produit",
    total: "Total",
    tracking: "Suivi du colis",
    shippedOn: (date: string) => `Expédiée le ${date}`,
    track: "Suivre mon colis →",
    address: "Adresse : ",
    payment: "Paiement : ",
    delivery: "Livraison : ",
  },
  en: {
    title: "My orders",
    empty: "You don't have any orders yet.",
    discover: "Discover the cardigan",
    cancelled: "Order cancelled",
    product: "Product",
    total: "Total",
    tracking: "Parcel tracking",
    shippedOn: (date: string) => `Shipped on ${date}`,
    track: "Track my parcel →",
    address: "Address: ",
    payment: "Payment: ",
    delivery: "Delivery: ",
  },
};

export default async function OrdersPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = toLocale((await params).lang);
  const t = TEXT[lang];
  const intl = INTL_LOCALE[lang];
  const session = await getServerSession(authOptions as AuthOptions);
  if (!session?.user) redirect(localePath(lang, "/auth/login"));

  await connectDB();

  const orders = await Order.find(orderEmailFilter(session.user.email))
    .populate("products.product", "name price translations")
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  return (
    <div>
      <h1 className="db-page-title" data-reveal>{t.title}</h1>

      <div className="db-wrapper" data-reveal-stagger>
        {orders.length === 0 ? (
          <div className="db-card" style={{ textAlign: "center", padding: "48px 24px" }}>
            <p style={{ fontSize: 14, color: "#888", marginBottom: 16 }}>
              {t.empty}
            </p>
            <Link href={localePath(lang, "/#piece")} className="db-add-address" style={{ display: "inline-flex" }}>
              {t.discover}
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order: any) => {
              const statusKey = STATUS_COLORS[order.status] ? order.status : "pending";
              const currentStep = STEP_INDEX[order.status] ?? -1;

              return (
                <div key={order._id} className="order-card">

                  {/* Header */}
                  <div className="order-card-header">
                    <div>
                      <span className="order-card-id">
                        #{order._id.toString().slice(-6).toUpperCase()}
                      </span>
                      <span className="order-card-date">
                        {new Date(order.createdAt).toLocaleDateString(intl, {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <span className={`db-badge db-badge-${statusKey}`}>{orderStatusLabel(statusKey, lang)}</span>
                  </div>

                  <div className="order-card-body">

                    {/* Timeline */}
                    {order.status !== "cancelled" && (
                      <div className="order-timeline">
                        {STATUS_STEPS.map((step, index) => {
                          const stepColor = STATUS_COLORS[step];
                          const isActive = index <= currentStep;
                          const isCurrent = index === currentStep;

                          return (
                            <div key={step} className="timeline-step">
                              <div
                                className="timeline-dot"
                                style={{
                                  backgroundColor: isActive ? stepColor : "#e5e7eb",
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
                                {orderStatusLabel(step, lang)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Annulée */}
                    {order.status === "cancelled" && (
                      <div className="order-cancelled-banner">
                        {t.cancelled}
                      </div>
                    )}

                    {/* Produits */}
                    <div className="order-products">
                      {order.products?.map((item: any, idx: number) => (
                        <div key={idx} className="order-product-row">
                          <span>{localizeProduct(item.product, lang)?.name || t.product}</span>
                          <span>× {item.quantity}</span>
                        </div>
                      ))}
                      <div className="order-total-row">
                        <span>{t.total}</span>
                        <span className="order-total-value">
                          {formatMoney(order.total, lang)}
                        </span>
                      </div>
                    </div>

                    {/* Suivi du colis */}
                    {(order.status === "shipped" || order.status === "delivered") && (order as any).delivery?.trackingNumber && (
                      <div className="order-tracking">
                        <p className="order-tracking-label">
                          {t.tracking}
                        </p>
                        <p className="order-tracking-number">
                          {(order as any).delivery.trackingNumber}
                        </p>
                        {(order as any).delivery.shippedAt && (
                          <p className="order-tracking-date">
                            {t.shippedOn(new Date((order as any).delivery.shippedAt).toLocaleDateString(intl, { day: "numeric", month: "long", year: "numeric" }))}
                          </p>
                        )}
                        <a
                          href={(order as any).delivery.trackingUrl || `https://www.laposte.fr/outils/suivre-vos-envois?code=${(order as any).delivery.trackingNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="order-tracking-link"
                        >
                          {t.track}
                        </a>
                      </div>
                    )}

                    {/* Infos livraison */}
                    <div className="order-meta">
                      {order.customer?.address && (
                        <span>
                          <strong>{t.address}</strong>
                          {order.customer.address}, {order.customer.city}
                        </span>
                      )}
                      {order.payment && (
                        <span>
                          <strong>{t.payment}</strong>
                          {paymentLabel(order.payment, lang)}
                        </span>
                      )}
                      {(order as any).delivery?.method && (
                        <span>
                          <strong>{t.delivery}</strong>
                          {(order as any).delivery.methodName || (order as any).delivery.method}
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
