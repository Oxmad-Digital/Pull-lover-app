import { getServerSession } from "next-auth";
import type { AuthOptions } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import { redirect } from "next/navigation";
import { connectDB } from "@/app/lib/db";
import Order from "@/app/models/Order";
import User from "@/app/models/User";
import Link from "next/link";
import { orderEmailFilter } from "@/app/lib/text";
import { INTL_LOCALE, localePath, toLocale } from "@/app/i18n/config.mjs";
import { formatMoney } from "@/app/i18n/format.mjs";
import { orderStatusLabel } from "@/app/i18n/orders.mjs";

const STATUSES = ["pending", "confirmed", "processing", "paid", "shipped", "delivered", "cancelled"];

type OrderDoc = {
  _id: { toString(): string };
  status: string;
  createdAt: Date | string;
  total: number;
  products?: { quantity?: number }[];
};

type UserDoc = {
  address?: { street?: string; city?: string; postalCode?: string; country?: string } | null;
};

const TEXT = {
  fr: {
    title: "Vue d'ensemble",
    orders: "Commandes",
    total: "au total",
    spent: "Total dépensé",
    allOrders: "toutes commandes",
    inProgress: "En cours",
    active: (count: number) => (count <= 1 ? "commande active" : "commandes actives"),
    recent: "Dernières commandes",
    seeAll: "Tout voir →",
    noOrders: "Aucune commande pour le moment.",
    discover: "Découvrir le cardigan",
    items: (count: number) => `${count} article${count > 1 ? "s" : ""}`,
    more: (count: number) => `+ ${count} autres commandes`,
    myAddress: "Mon adresse",
    manage: "Gérer →",
    noAddress: "Aucune adresse enregistrée.",
    addAddress: "+ Ajouter une adresse",
    delivery: "Livraison",
  },
  en: {
    title: "Overview",
    orders: "Orders",
    total: "in total",
    spent: "Total spent",
    allOrders: "all orders",
    inProgress: "In progress",
    active: (count: number) => (count <= 1 ? "active order" : "active orders"),
    recent: "Latest orders",
    seeAll: "See all →",
    noOrders: "No orders yet.",
    discover: "Discover the cardigan",
    items: (count: number) => `${count} item${count > 1 ? "s" : ""}`,
    more: (count: number) => `+ ${count} more orders`,
    myAddress: "My address",
    manage: "Manage →",
    noAddress: "No saved address.",
    addAddress: "+ Add an address",
    delivery: "Delivery",
  },
};

export default async function DashboardOverview({ params }: { params: Promise<{ lang: string }> }) {
  const lang = toLocale((await params).lang);
  const t = TEXT[lang];
  const href = (path: string) => localePath(lang, path);
  const session = await getServerSession(authOptions as AuthOptions);
  if (!session?.user) redirect(href("/auth/login"));

  await connectDB();

  const allOrders = await Order.find(orderEmailFilter(session.user.email))
    .sort({ createdAt: -1 })
    .lean()
    .exec() as unknown as OrderDoc[];

  const user = await User.findOne({ email: session.user.email }).lean().exec() as unknown as UserDoc | null;
  const address = user?.address || null;

  // KPIs
  const totalOrders = allOrders.length;
  const totalSpent = allOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const pendingCount = allOrders.filter(
    (o) => !["delivered", "cancelled"].includes(o.status)
  ).length;

  // 3 dernières commandes pour le résumé
  const recentOrders = allOrders.slice(0, 3);

  return (
    <div>
      <h1 className="db-page-title" data-reveal>{t.title}</h1>

      {/* ── KPIs ── */}
      <div className="db-kpis" data-reveal-stagger>
        <div className="db-kpi-card">
          <span className="db-kpi-label">{t.orders}</span>
          <span className="db-kpi-value">{totalOrders}</span>
          <span className="db-kpi-sub">{t.total}</span>
        </div>
        <div className="db-kpi-card">
          <span className="db-kpi-label">{t.spent}</span>
          <span className="db-kpi-value">{formatMoney(totalSpent, lang)}</span>
          <span className="db-kpi-sub">{t.allOrders}</span>
        </div>
        <div className="db-kpi-card">
          <span className="db-kpi-label">{t.inProgress}</span>
          <span className="db-kpi-value">{pendingCount}</span>
          <span className="db-kpi-sub">{t.active(pendingCount)}</span>
        </div>
      </div>

      <div className="db-wrapper" data-reveal-stagger>

        {/* ── Résumé commandes ── */}
        <div className="db-card db-summary-card">
          <div className="db-summary-header">
            <p className="db-section-title" style={{ margin: 0 }}>{t.recent}</p>
            {totalOrders > 0 && (
              <Link href={href("/dashboard/orders")} className="db-summary-link">{t.seeAll}</Link>
            )}
          </div>

          {recentOrders.length === 0 ? (
            <div className="db-summary-empty">
              <p>{t.noOrders}</p>
              <Link href={href("/#piece")} className="db-add-address" style={{ marginTop: 12 }}>
                {t.discover}
              </Link>
            </div>
          ) : (
            <div className="db-recent-orders">
              {recentOrders.map((order) => {
                const statusKey = STATUSES.includes(order.status) ? order.status : "pending";
                const articleCount = order.products?.reduce((s, i) => s + (i.quantity || 1), 0) || 0;
                return (
                  <div key={order._id.toString()} className="db-recent-order-row">
                    <span className="db-order-num">
                      #{order._id.toString().slice(-6).toUpperCase()}
                    </span>
                    <span className="db-recent-order-date">
                      {new Date(order.createdAt).toLocaleDateString(INTL_LOCALE[lang])}
                    </span>
                    <span className="db-recent-order-items">
                      {t.items(articleCount)}
                    </span>
                    <span className={`db-badge db-badge-${statusKey}`}>{orderStatusLabel(statusKey, lang)}</span>
                    <span className="db-recent-order-total">
                      {formatMoney(order.total, lang)}
                    </span>
                  </div>
                );
              })}
              {totalOrders > 3 && (
                <Link href={href("/dashboard/orders")} className="db-summary-more">
                  {t.more(totalOrders - 3)}
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ── Résumé adresses ── */}
        <div className="db-card db-summary-card">
          <div className="db-summary-header">
            <p className="db-section-title" style={{ margin: 0 }}>{t.myAddress}</p>
            <Link href={href("/dashboard/addresses")} className="db-summary-link">{t.manage}</Link>
          </div>

          {!address?.street ? (
            <div className="db-summary-empty">
              <p>{t.noAddress}</p>
              <Link href={href("/dashboard/addresses")} className="db-add-address" style={{ marginTop: 12 }}>
                {t.addAddress}
              </Link>
            </div>
          ) : (
            <div className="db-summary-addresses">
              <div className="db-summary-address-chip">
                <span className="db-summary-address-label">{t.delivery}</span>
                <span className="db-summary-address-text">
                  {address.street}, {address.postalCode} {address.city}
                  {address.country ? `, ${address.country}` : ""}
                </span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
