"use client";

import { useEffect, useState } from "react";
import styles from "../dashboard.module.css";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";

const PIE_COLORS = ["#C75C5C", "#243B3B", "#AD4646", "#706666", "#E8DAD6"];

const STATUS_LABELS = {
  pending:    "En attente",
  confirmed:  "Confirmée",
  processing: "En traitement",
  paid:       "Payée",
  shipped:    "Expédiée",
  delivered:  "Livrée",
  cancelled:  "Annulée",
};

const font = "var(--pl-sans)";

const N = {
  border:      "rgba(36, 59, 59, 0.17)",
  borderLight: "rgba(36, 59, 59, 0.09)",
  bg:          "#ffffff",
  bgMuted:     "#FFF9F6",
  text:        "#243B3B",
  muted:       "#706666",
  accent:      "#C75C5C",
  accentDark:  "#AD4646",
  radius:      "0px",
};

const thStyle = {
  padding: "7px 16px",
  textAlign: "left",
  fontSize: "10px",
  fontWeight: "600",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  color: N.muted,
  fontFamily: font,
  borderBottom: `1px solid ${N.border}`,
  background: N.bgMuted,
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "9px 16px",
  fontSize: "13px",
  color: N.text,
  fontFamily: font,
  fontWeight: "500",
};

export default function DashboardStats() {
  const [data, setData]     = useState(null);
  const [error, setError]   = useState(false);
  const [period, setPeriod] = useState("7");

  useEffect(() => {
    fetch(`/api/admin/stats?period=${period}`)
      .then(async (res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then(setData)
      .catch(() => setError(true));
  }, [period]);

  if (error) return (
    <div style={{ padding: "11px 14px", background: "#fff8f8", border: "1px solid #ffd4d4", borderRadius: N.radius, color: "#b91c1c", fontSize: "13px", fontFamily: font }}>
      Erreur lors du chargement des statistiques
    </div>
  );

  if (!data) return (
    <div style={{ padding: "48px 0", textAlign: "center", color: N.muted, fontSize: "13px", fontFamily: font }}>
      Chargement…
    </div>
  );

  const { stats, salesEvolution, topProducts, topCustomers, recentOrders, paymentDistribution } = data;
  const growth = stats.revenueGrowth !== null ? parseFloat(stats.revenueGrowth) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontFamily: font }}>

      {/* ── Sélecteur de période ── */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ display: "inline-flex", gap: "2px", background: N.bgMuted, borderRadius: "6px", padding: "3px", border: `1px solid ${N.border}` }}>
          {[
            { label: "Auj.",  value: "1"   },
            { label: "7 j.",  value: "7"   },
            { label: "30 j.", value: "30"  },
            { label: "Année", value: "365" },
          ].map((p) => (
            <button key={p.value} onClick={() => { if (p.value !== period) { setData(null); setError(false); setPeriod(p.value); } }} style={{
              padding: "5px 14px", borderRadius: "4px", border: "none",
              background: period === p.value ? N.accent : "transparent",
              color:      period === p.value ? "#fff" : N.muted,
              fontWeight: period === p.value ? "600"   : "400",
              boxShadow:  period === p.value ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              cursor: "pointer", fontSize: "12px", fontFamily: font,
              transition: "all 0.15s", whiteSpace: "nowrap",
            }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Row 1 — métriques principales ── */}
      <div className="kpi-grid" style={{ background: N.bg, border: `1px solid ${N.border}`, borderRadius: N.radius, overflow: "hidden" }}>
        <KPICell border small label="Clients"    value={stats.customersCount ?? 0}   sub={`+${stats.newCustomers ?? 0} nouveaux`} />
        <KPICell border small label="Commandes"  value={stats.ordersCount ?? 0}       sub={`${stats.periodOrders ?? 0} / période`} />
        <KPICell border small label="CA période" value={`${parseFloat(stats.periodRevenue || 0).toLocaleString("fr-FR")} €`}
          sub={growth !== null
            ? <TrendChip value={growth} />
            : `Total : ${parseFloat(stats.totalRevenue || 0).toLocaleString("fr-FR")} €`}
        />
        <KPICell small label="Panier moyen" value={`${parseFloat(stats.averageBasket || 0).toLocaleString("fr-FR")} €`} sub={`Aujourd'hui : ${stats.todayOrders ?? 0} cmd`} />
      </div>

      {/* ── KPI Row 2 — métriques secondaires ── */}
      <div className="kpi-grid" style={{ background: N.bg, border: `1px solid ${N.border}`, borderRadius: N.radius, overflow: "hidden" }}>
        <KPICell border small label="Taux d'annulation" value={`${stats.cancellationRate ?? 0}%`}    sub={`${stats.cancelledOrders ?? 0} cmd annulées`} />
        <KPICell border small label="Fidélisation"       value={`${stats.loyaltyRate ?? 0}%`}          sub={`${stats.returningCustomers ?? 0} clients récurrents`} />
        <KPICell border small label="Clients dormants"   value={stats.dormantCustomers ?? 0}            sub="sans achat depuis 30 j" />
        <KPICell       small label="Valeur du stock"    value={`${(stats.stockValue ?? 0).toLocaleString("fr-FR")} €`} sub="stock × prix catalogue" />
      </div>

      {/* ── Alertes ── */}
      {(stats.lowStockProducts > 0 || stats.pendingOrders > 0 || stats.neverSoldProducts > 0) && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {stats.lowStockProducts  > 0 && <Alert type="warning" message={`${stats.lowStockProducts} produit(s) en stock faible`} />}
          {stats.pendingOrders     > 0 && <Alert type="info"    message={`${stats.pendingOrders} commande(s) en attente`} />}
          {stats.neverSoldProducts > 0 && <Alert type="neutral" message={`${stats.neverSoldProducts} produit(s) jamais vendus`} />}
        </div>
      )}

      {/* ── Graphiques : évolution + modes de paiement ── */}
      <div className="dashboard-charts">
        <MiniCard label="Évolution des ventes">
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={salesEvolution} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={N.borderLight} vertical={false} />
              <XAxis dataKey="date" fontSize={10} tick={{ fill: N.muted, fontFamily: font }} tickLine={false} axisLine={false} />
              <YAxis fontSize={10} tick={{ fill: N.muted, fontFamily: font }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: N.bg, border: `1px solid ${N.border}`, borderRadius: "6px", fontSize: "11px", fontFamily: font, boxShadow: "none" }} />
              <Line type="monotone" dataKey="revenue" stroke={N.accent} strokeWidth={1.5} name="CA (€)"    dot={false} />
              <Line type="monotone" dataKey="orders"  stroke={N.text}  strokeWidth={1.5} name="Commandes" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </MiniCard>

        <MiniCard label="Modes de paiement">
          {paymentDistribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={paymentDistribution} cx="50%" cy="50%" outerRadius={48} innerRadius={24} dataKey="value" paddingAngle={2} nameKey="label">
                    {paymentDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: N.bg, border: `1px solid ${N.border}`, borderRadius: "6px", fontSize: "11px", fontFamily: font, boxShadow: "none" }}
                    formatter={(v, _, props) => [v, props.payload.label || props.payload.name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginTop: "8px" }}>
                {paymentDistribution.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", fontFamily: font }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                      <span style={{ color: N.text }}>{item.label}</span>
                    </div>
                    <span style={{ color: N.muted, fontWeight: "600" }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ padding: "32px 0", textAlign: "center", color: N.muted, fontSize: "12px" }}>Aucune donnée</div>
          )}
        </MiniCard>
      </div>

      {/* ── Top 5 produits ── */}
      <MiniCard label="Top 5 produits">
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
            <XAxis type="number" fontSize={10} tick={{ fill: N.muted, fontFamily: font }} tickLine={false} axisLine={false} />
            <YAxis dataKey="name" type="category" width={130} tick={{ fill: N.text, fontSize: 11, fontFamily: font }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: N.bg, border: `1px solid ${N.border}`, borderRadius: "6px", fontSize: "11px", fontFamily: font, boxShadow: "none" }} />
            <Bar dataKey="quantity" fill={N.accent} radius={0} maxBarSize={10} />
          </BarChart>
        </ResponsiveContainer>
      </MiniCard>

      {/* ── Dernières commandes + Top clients ── */}
      <div className={styles.bottomGrid}>

        <TableCard label="Dernières commandes">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>{["Client", "Montant", "Statut", "Date"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {recentOrders.map((order, i) => (
                <tr key={order._id || i} style={{ borderTop: `1px solid ${N.borderLight}` }}>
                  <td style={tdStyle}>{order.customer.firstname} {order.customer.lastname}</td>
                  <td style={{ ...tdStyle, fontWeight: "600", whiteSpace: "nowrap" }}>{parseFloat(order.total).toLocaleString("fr-FR")} €</td>
                  <td style={tdStyle}><StatusBadge status={order.status} /></td>
                  <td style={{ ...tdStyle, color: N.muted, fontSize: "11px", whiteSpace: "nowrap" }}>{new Date(order.createdAt).toLocaleDateString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>

        <TableCard label="Top 5 clients">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>{["Client", "Cmd", "Total dépensé"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {topCustomers.length === 0 ? (
                <tr><td colSpan={3} style={{ ...tdStyle, color: N.muted, textAlign: "center", padding: "20px" }}>Aucune donnée</td></tr>
              ) : topCustomers.map((c, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${N.borderLight}` }}>
                  <td style={tdStyle}>{c.firstname} {c.lastname}</td>
                  <td style={{ ...tdStyle, color: N.muted, textAlign: "center" }}>{c.totalOrders}</td>
                  <td style={{ ...tdStyle, fontWeight: "600", whiteSpace: "nowrap" }}>{parseFloat(c.totalSpent).toLocaleString("fr-FR")} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>

      </div>
    </div>
  );
}

/* ── Sous-composants ── */

function KPICell({ label, value, sub, border, small }) {
  return (
    <div className={border ? "kpi-cell kpi-cell-bordered" : "kpi-cell"} style={{ padding: small ? "13px 18px" : "18px 22px" }}>
      <div style={{ fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.09em", color: N.muted, marginBottom: "7px", fontFamily: font }}>
        {label}
      </div>
      <div style={{ fontSize: small ? "24px" : "28px", fontWeight: "400", color: N.text, lineHeight: 1.05, marginBottom: "6px", fontFamily: "var(--pl-serif)" }}>
        {value}
      </div>
      <div style={{ fontSize: "11px", color: N.muted, fontFamily: font }}>
        {sub}
      </div>
    </div>
  );
}

function TrendChip({ value }) {
  const up = value >= 0;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", padding: "1px 6px", background: up ? "#f0fdf4" : "#fff5f5", color: up ? "#166534" : "#b91c1c", borderRadius: "4px", fontSize: "11px", fontWeight: "600", fontFamily: font }}>
      {up ? "↑" : "↓"} {Math.abs(value)}% <span style={{ fontWeight: "400", color: up ? "#4ade8077" : "#f87171aa" }}>vs préc.</span>
    </span>
  );
}

function MiniCard({ label, children }) {
  return (
    <div style={{ background: N.bg, border: `1px solid ${N.border}`, borderRadius: N.radius, padding: "14px 18px" }}>
      <div style={{ fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.09em", color: N.muted, marginBottom: "12px", fontFamily: font }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function TableCard({ label, children }) {
  return (
    <div style={{ background: N.bg, border: `1px solid ${N.border}`, borderRadius: N.radius, overflow: "hidden" }}>
      <div style={{ padding: "9px 16px", borderBottom: `1px solid ${N.border}`, background: N.bgMuted }}>
        <span style={{ fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.09em", color: N.muted, fontFamily: font }}>
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

function Alert({ type, message }) {
  const s = {
    warning: { bg: "#fffbf0", border: "#eddcb0", text: "#7c5200", dot: "#f59e0b" },
    info:    { bg: "#f5f8ff", border: "#c4d4f0", text: "#1e3a5f", dot: "#3b82f6" },
    neutral: { bg: N.bgMuted, border: N.border,   text: N.muted,   dot: "#c4b5a5" },
  }[type] || {};
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", background: s.bg, border: `1px solid ${s.border}`, borderRadius: "6px", color: s.text, fontSize: "12px", fontWeight: "500", fontFamily: font, flex: 1 }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {message}
    </div>
  );
}

function StatusBadge({ status }) {
  const c = {
    pending:    { bg: "#fffbf0", text: "#7c5200" },
    confirmed:  { bg: "#f5f8ff", text: "#1e3a5f" },
    processing: { bg: "#f5f3ff", text: "#5b21b6" },
    paid:       { bg: "#f0fdf4", text: "#166534" },
    shipped:    { bg: "#ecfeff", text: "#155e75" },
    delivered:  { bg: "#f0fdf4", text: "#166534" },
    cancelled:  { bg: "#fff5f5", text: "#b91c1c" },
  }[status] || { bg: N.bgMuted, text: N.muted };
  return (
    <span style={{ padding: "2px 8px", background: c.bg, color: c.text, borderRadius: "4px", fontSize: "11px", fontWeight: "600", fontFamily: font, display: "inline-block", letterSpacing: "0.02em" }}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}
