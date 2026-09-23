import { getServerSession } from "next-auth";
import type { AuthOptions } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { connectDB } from "@/app/lib/db";
import Order from "@/app/models/Order";
import User from "@/app/models/User";
import Link from "next/link";

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  pending:    { label: "En attente",     badgeClass: "db-badge db-badge-pending"    },
  confirmed:  { label: "Confirmée",      badgeClass: "db-badge db-badge-confirmed"  },
  processing: { label: "En préparation", badgeClass: "db-badge db-badge-processing" },
  paid:       { label: "Payée",          badgeClass: "db-badge db-badge-paid"       },
  shipped:    { label: "Expédiée",       badgeClass: "db-badge db-badge-shipped"    },
  delivered:  { label: "Livrée",        badgeClass: "db-badge db-badge-delivered"  },
  cancelled:  { label: "Annulée",       badgeClass: "db-badge db-badge-cancelled"  },
};

export default async function DashboardOverview() {
  const session = await getServerSession(authOptions as AuthOptions);
  if (!session?.user) redirect("/auth/login");

  await connectDB();

  const allOrders = await Order.find({ "customer.email": session.user.email })
    .sort({ createdAt: -1 })
    .lean()
    .exec() as any[];

  const user = await User.findOne({ email: session.user.email }).lean().exec() as any;
  const address = user?.address || null;

  // KPIs
  const totalOrders = allOrders.length;
  const totalSpent = allOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const pendingCount = allOrders.filter(
    (o) => !["delivered", "cancelled"].includes(o.status)
  ).length;

  // 3 dernières commandes pour le résumé
  const recentOrders = allOrders.slice(0, 3) as any[];

  return (
    <div>
      <h1 className="db-page-title">Vue d&apos;ensemble</h1>

      {/* ── KPIs ── */}
      <div className="db-kpis">
        <div className="db-kpi-card">
          <span className="db-kpi-label">Commandes</span>
          <span className="db-kpi-value">{totalOrders}</span>
          <span className="db-kpi-sub">au total</span>
        </div>
        <div className="db-kpi-card">
          <span className="db-kpi-label">Total dépensé</span>
          <span className="db-kpi-value">{totalSpent.toLocaleString("fr-FR")} €</span>
          <span className="db-kpi-sub">toutes commandes</span>
        </div>
        <div className="db-kpi-card">
          <span className="db-kpi-label">En cours</span>
          <span className="db-kpi-value">{pendingCount}</span>
          <span className="db-kpi-sub">{pendingCount <= 1 ? "commande active" : "commandes actives"}</span>
        </div>
      </div>

      <div className="db-wrapper">

        {/* ── Résumé commandes ── */}
        <div className="db-card db-summary-card">
          <div className="db-summary-header">
            <p className="db-section-title" style={{ margin: 0 }}>Dernières commandes</p>
            {totalOrders > 0 && (
              <Link href="/dashboard/orders" className="db-summary-link">Tout voir →</Link>
            )}
          </div>

          {recentOrders.length === 0 ? (
            <div className="db-summary-empty">
              <p>Aucune commande pour le moment.</p>
              <Link href="/#piece" className="db-add-address" style={{ marginTop: 12 }}>
                Découvrir le Mantasoa
              </Link>
            </div>
          ) : (
            <div className="db-recent-orders">
              {recentOrders.map((order) => {
                const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const articleCount = order.products?.reduce((s: number, i: any) => s + (i.quantity || 1), 0) || 0;
                return (
                  <div key={order._id} className="db-recent-order-row">
                    <span className="db-order-num">
                      #{order._id.toString().slice(-6).toUpperCase()}
                    </span>
                    <span className="db-recent-order-date">
                      {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                    <span className="db-recent-order-items">
                      {articleCount} article{articleCount > 1 ? "s" : ""}
                    </span>
                    <span className={status.badgeClass}>{status.label}</span>
                    <span className="db-recent-order-total">
                      {Number(order.total).toLocaleString("fr-FR")} €
                    </span>
                  </div>
                );
              })}
              {totalOrders > 3 && (
                <Link href="/dashboard/orders" className="db-summary-more">
                  + {totalOrders - 3} autres commandes
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ── Résumé adresses ── */}
        <div className="db-card db-summary-card">
          <div className="db-summary-header">
            <p className="db-section-title" style={{ margin: 0 }}>Mon adresse</p>
            <Link href="/dashboard/addresses" className="db-summary-link">Gérer →</Link>
          </div>

          {!address?.street ? (
            <div className="db-summary-empty">
              <p>Aucune adresse enregistrée.</p>
              <Link href="/dashboard/addresses" className="db-add-address" style={{ marginTop: 12 }}>
                + Ajouter une adresse
              </Link>
            </div>
          ) : (
            <div className="db-summary-addresses">
              <div className="db-summary-address-chip">
                <span className="db-summary-address-label">Livraison</span>
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
