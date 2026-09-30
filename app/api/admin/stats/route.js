export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { connectDB } from "@/app/lib/db";
import Order    from "@/app/models/Order";
import Customer from "@/app/models/Customer";
import Product  from "@/app/models/Product";
import { requireAdmin } from "@/app/lib/auth";

// Valeur numérique d'un champ jsonb (NULL si le texte n'est pas un nombre)
const num = (expr) => `(CASE WHEN ${expr} ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN (${expr})::float8 END)`;
const ORDER_LINES = `jsonb_array_elements(CASE WHEN jsonb_typeof(o.data->'products') = 'array' THEN o.data->'products' ELSE '[]'::jsonb END)`;

const fetchStats = unstable_cache(
  async (period) => {
    try {
    const sql = await connectDB();
    const daysAgo = parseInt(period);

    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - daysAgo);
    periodStart.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Période précédente (pour trend CA)
    const prevPeriodStart = new Date(periodStart);
    prevPeriodStart.setDate(prevPeriodStart.getDate() - daysAgo);

    // ── Toutes les requêtes indépendantes en parallèle ──
    const [
      customersCount,
      newCustomers,
      ordersCount,
      periodOrdersCount,
      todayOrders,
      cancelledOrders,
      pendingOrders,
      returningCustomers,
      dormantCustomers,
      lowStockProducts,

      totalRevenueAgg,
      periodRevenueAgg,
      prevPeriodRevenueAgg,
      stockValueAgg,

      salesEvolutionAgg,
      topProductsAgg,
      ordersByStatusAgg,
      paymentAgg,
      [{ count: neverSoldProducts }],
      topCustomersAgg,
      recentOrders,
    ] = await Promise.all([
      // Counts clients
      Customer.countDocuments(),
      Customer.countDocuments({ createdAt: { $gte: periodStart } }),

      // Counts commandes
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: periodStart } }),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ status: "cancelled" }),
      Order.countDocuments({ status: "pending" }),

      // Clients
      Customer.countDocuments({ totalOrders: { $gt: 1 } }),
      Customer.countDocuments({ lastOrderAt: { $ne: null, $lt: thirtyDaysAgo }, status: "active" }),

      // Stock
      Product.countDocuments({ stock: { $gt: 0, $lt: 5 } }),

      // Revenus
      sql.query(`SELECT COALESCE(sum(${num("data->>'total'")}), 0) AS total FROM orders`),
      Order.aggregate([
        { $match: { createdAt: { $gte: periodStart } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: prevPeriodStart, $lt: periodStart } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Product.aggregate([
        { $match: { isAvailable: true } },
        { $group: { _id: null, total: { $sum: { $multiply: ["$stock", "$price"] } } } },
      ]),

      // Évolution ventes — 1 seule agrégation (au lieu d'une boucle)
      Order.aggregate([
        { $match: { createdAt: { $gte: periodStart } } },
        {
          $group: {
            _id: {
              y: { $year: "$createdAt" },
              m: { $month: "$createdAt" },
              d: { $dayOfMonth: "$createdAt" },
            },
            revenue: { $sum: "$total" },
            orders:  { $sum: 1 },
          },
        },
        { $sort: { "_id.y": 1, "_id.m": 1, "_id.d": 1 } },
      ]),

      // Top produits
      sql.query(`
        WITH sold AS (
          SELECT line->>'product' AS product_id, COALESCE(sum(${num("line->>'quantity'")}), 0) AS quantity
          FROM orders o, ${ORDER_LINES} AS line
          GROUP BY 1 ORDER BY 2 DESC LIMIT 5
        )
        SELECT p.data->>'name' AS name, sold.quantity
        FROM sold JOIN products p ON p.id::text = lower(sold.product_id)
        ORDER BY sold.quantity DESC
      `),

      // Distributions
      sql.query(`SELECT data->>'status' AS "_id", count(*)::int AS count FROM orders GROUP BY 1`),
      sql.query(`SELECT COALESCE(data->>'payment', 'cash') AS "_id", count(*)::int AS count FROM orders GROUP BY 1`),

      // Produits en stock jamais vendus
      sql.query(`
        SELECT count(*)::int AS count FROM products p
        WHERE p.data->>'isAvailable' = 'true' AND ${num("p.data->>'stock'")} > 0
          AND NOT EXISTS (SELECT 1 FROM orders o, ${ORDER_LINES} AS line WHERE lower(line->>'product') = p.id::text)
      `),

      // Top clients calculé depuis les commandes (fiable même si Customer.totalSpent non mis à jour)
      sql.query(`
        SELECT (array_agg(data #>> '{customer,firstname}' ORDER BY created_at))[1] AS firstname,
               (array_agg(data #>> '{customer,lastname}' ORDER BY created_at))[1] AS lastname,
               COALESCE(sum(${num("data->>'total'")}), 0) AS "totalSpent",
               count(*)::int AS "totalOrders"
        FROM orders GROUP BY data #>> '{customer,email}'
        ORDER BY 3 DESC LIMIT 5
      `),

      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("customer.firstname customer.lastname total status createdAt")
        .lean(),
    ]);

    // ── Calculs dérivés ──
    const totalRevenue      = totalRevenueAgg[0]?.total      || 0;
    const periodRevenue     = periodRevenueAgg[0]?.total     || 0;
    const prevPeriodRevenue = prevPeriodRevenueAgg[0]?.total || 0;
    const stockValue        = Number(stockValueAgg[0]?.total)  || 0;
    const averageBasket     = ordersCount > 0 ? (totalRevenue / ordersCount).toFixed(2) : 0;
    const cancellationRate  = ordersCount > 0 ? ((cancelledOrders / ordersCount) * 100).toFixed(1) : 0;
    const loyaltyRate       = customersCount > 0 ? ((returningCustomers / customersCount) * 100).toFixed(1) : 0;
    const revenueGrowth     = prevPeriodRevenue > 0
      ? (((periodRevenue - prevPeriodRevenue) / prevPeriodRevenue) * 100).toFixed(1)
      : null;

    // ── Évolution : remplir les jours sans commandes ──
    const evoMap = {};
    salesEvolutionAgg.forEach(({ _id, revenue, orders }) => {
      const key = `${_id.y}-${String(_id.m).padStart(2, "0")}-${String(_id.d).padStart(2, "0")}`;
      evoMap[key] = { revenue, orders };
    });
    const salesEvolution = [];
    for (let i = daysAgo - 1; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
      salesEvolution.push({
        date:    day.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
        revenue: evoMap[key]?.revenue || 0,
        orders:  evoMap[key]?.orders  || 0,
      });
    }

    // ── Distributions formatées ──
    const PAYMENT_LABELS = {
      cash:          "Espèces",
      mobile_money:  "Mobile Money",
      card:          "Carte",
      bank_transfer: "Virement",
    };

    const statusDistribution = ordersByStatusAgg.map((item) => ({
      name: item._id, value: item.count,
    }));

    const paymentDistribution = paymentAgg.map((item) => ({
      name:  item._id || "cash",
      label: PAYMENT_LABELS[item._id] || item._id || "Espèces",
      value: item.count,
    }));

    return {
      success: true,
      stats: {
        customersCount,
        newCustomers,
        ordersCount,
        periodOrders:     periodOrdersCount,
        totalRevenue:     totalRevenue.toFixed(2),
        periodRevenue:    periodRevenue.toFixed(2),
        prevPeriodRevenue: prevPeriodRevenue.toFixed(2),
        revenueGrowth,
        averageBasket,
        todayOrders,
        lowStockProducts,
        pendingOrders,
        cancelledOrders,
        cancellationRate,
        returningCustomers,
        loyaltyRate,
        dormantCustomers,
        stockValue:       Math.round(stockValue),
        neverSoldProducts,
      },
      salesEvolution,
      topProducts:        topProductsAgg,
      topCustomers:       topCustomersAgg,
      recentOrders,
      statusDistribution,
      paymentDistribution,
    };
  } catch (error) {
    console.error("STATS ERROR:", error);
    return { success: false, message: "Erreur stats", error: error.message };
  }
},
  ["admin-stats"],
  { revalidate: 60 }
);

export async function GET(request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  // Bornée : la période pilote une boucle jour par jour et une clé de cache
  const period = String(Math.min(365, Math.max(1, parseInt(searchParams.get("period")) || 7)));

  const data = await fetchStats(period);

  if (!data.success) {
    return NextResponse.json(data, { status: 500 });
  }
  return NextResponse.json(data);
}
