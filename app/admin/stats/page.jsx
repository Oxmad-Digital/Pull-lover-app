import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/lib/authOptions";
import { getClient } from "@/app/lib/db";
import { DEVICE_LABELS, countryLabel, formatDuration } from "@/app/lib/analytics.mjs";
import TrafficChart from "./TrafficChart";
import WorldMap from "./WorldMap";
import styles from "./stats.module.css";

export const dynamic = "force-dynamic";

const PERIODS = [
  { days: 7, label: "7 j." },
  { days: 30, label: "30 j." },
  { days: 90, label: "90 j." },
  { days: 365, label: "Année" },
];
const DEFAULT_DAYS = 30;

/** Jour UTC (AAAA-MM-JJ) d'il y a n jours, dans le même repère que /api/track. */
function daysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

async function getStats(rangeDays) {
  const sql = getClient();
  const since = daysAgo(rangeDays - 1);
  // Colonnes et filtres fixes ci-dessous (aucune entrée utilisateur)
  const grouped = (column, { where = "", limit = "ALL" } = {}) => sql.query(
    `SELECT ${column} AS label, count(*)::int AS value
     FROM page_views WHERE day >= $1 ${where}
     GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT ${limit}`,
    [since]
  );

  const [[totals], [session], dailyRows, pages, referrers, devices, countries] = await Promise.all([
    sql.query(
      `SELECT count(*)::int AS views, count(DISTINCT visitor_hash)::int AS visitors
       FROM page_views WHERE day >= $1`,
      [since]
    ),
    // Session = temps cumulé d'un visiteur sur une journée (son hash change chaque jour)
    sql.query(
      `SELECT avg(total)::float8 AS avg_ms FROM (
         SELECT sum(duration_ms) AS total FROM page_views
         WHERE day >= $1 AND duration_ms > 0 GROUP BY visitor_hash
       ) s`,
      [since]
    ),
    sql.query(
      `SELECT to_char(day, 'YYYY-MM-DD') AS day, count(*)::int AS views, count(DISTINCT visitor_hash)::int AS visitors
       FROM page_views WHERE day >= $1 GROUP BY day`,
      [since]
    ),
    grouped("path", { limit: 10 }),
    grouped("referrer", { limit: 10 }),
    grouped("device_type"),
    grouped("country", { where: "AND country <> ''" }),
  ]);

  const byDay = new Map(dailyRows.map((row) => [row.day, row]));
  const daily = Array.from({ length: rangeDays }, (_, i) => {
    const day = daysAgo(rangeDays - 1 - i);
    return byDay.get(day) ?? { day, views: 0, visitors: 0 };
  });

  return { totals, avgSessionMs: session?.avg_ms ?? null, daily, pages, referrers, devices, countries };
}

export default async function AdminStatsPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (session.user.role !== "admin") redirect("/admin/unauthorized");

  const requested = Number((await searchParams)?.period);
  const rangeDays = PERIODS.some((p) => p.days === requested) ? requested : DEFAULT_DAYS;

  let stats = null;
  try {
    stats = await getStats(rangeDays);
  } catch (error) {
    console.error("ADMIN ANALYTICS ERROR:", error.message);
  }

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <h1 className={styles.title}>Statistiques</h1>
        <nav className={styles.periods} aria-label="Période">
          {PERIODS.map(({ days, label }) => (
            <Link
              key={days}
              href={days === DEFAULT_DAYS ? "/admin/stats" : `/admin/stats?period=${days}`}
              className={`${styles.period}${days === rangeDays ? ` ${styles.periodActive}` : ""}`}
              aria-current={days === rangeDays ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {stats ? <StatsView {...stats} rangeDays={rangeDays} /> : (
        <div className={styles.error}>
          Erreur lors du chargement des statistiques. La table page_views existe-t-elle (npm run migrate) ?
        </div>
      )}
    </div>
  );
}

function StatsView({ totals, avgSessionMs, daily, pages, referrers, devices, countries, rangeDays }) {
  const avgPerDay = Math.round(totals.views / rangeDays);
  const fmt = (n) => n.toLocaleString("fr-FR");

  return (
    <div className={styles.wrap}>
      <div className="kpi-grid" style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-line)" }}>
        <Kpi bordered label={`Vues (${rangeDays} j)`} value={fmt(totals.views)} />
        <Kpi bordered label="Visiteurs uniques" value={fmt(totals.visitors)} />
        <Kpi bordered label="Moyenne / jour" value={fmt(avgPerDay)} />
        <Kpi label="Durée moyenne / session" value={formatDuration(avgSessionMs)} />
      </div>

      <Card title="Trafic quotidien">
        <TrafficChart daily={daily} />
      </Card>

      <div className={styles.threeCol}>
        <Card title="Pages les plus vues">
          <BarList items={pages} />
        </Card>
        <Card title="Provenance">
          <BarList items={referrers.map((r) => ({ ...r, label: r.label || "Direct" }))} />
        </Card>
        <Card title="Appareils">
          <BarList items={devices.map((d) => ({ ...d, label: DEVICE_LABELS[d.label] ?? d.label }))} />
        </Card>
      </div>

      <Card title="Origine géographique">
        <div className={styles.geoLayout}>
          <BarList items={countries.slice(0, 10).map((c) => ({ ...c, label: countryLabel(c.label) }))} />
          {countries.length > 0 && (
            <WorldMap countries={countries.map((c) => ({ code: c.label, name: countryLabel(c.label), views: c.value }))} />
          )}
        </div>
      </Card>
    </div>
  );
}

function Kpi({ label, value, bordered }) {
  return (
    <div className={bordered ? "kpi-cell kpi-cell-bordered" : "kpi-cell"} style={{ padding: "18px 22px" }}>
      <div className={styles.kpiLabel}>{label}</div>
      <div className={styles.kpiValue}>{value}</div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>{title}</h2>
      {children}
    </section>
  );
}

function BarList({ items }) {
  if (items.length === 0) return <p className={styles.empty}>Aucune donnée pour le moment.</p>;
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className={styles.barList}>
      {items.map((item) => (
        <li key={item.label} className={styles.barRow}>
          <span className={styles.barLabel} title={item.label}>{item.label}</span>
          <span className={styles.barTrack}>
            <span className={styles.bar} style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }} />
          </span>
          <span className={styles.barValue}>{item.value.toLocaleString("fr-FR")}</span>
        </li>
      ))}
    </ul>
  );
}
