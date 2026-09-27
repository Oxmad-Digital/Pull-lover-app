export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/auth";
import { connectDB } from "@/app/lib/db";
import Order from "@/app/models/Order";
import { escapeRegex } from "@/app/lib/text";

export async function GET(request) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search    = searchParams.get("search") || "";
    const status    = searchParams.get("status") || "";
    const sortField = searchParams.get("sort")   || "createdAt";
    const sortDir   = searchParams.get("order")  || "desc";
    const page      = Math.max(1, parseInt(searchParams.get("page"))  || 1);
    const limit     = Math.min(100, parseInt(searchParams.get("limit")) || 25);

    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { "customer.firstname": { $regex: escapeRegex(search), $options: "i" } },
        { "customer.lastname":  { $regex: escapeRegex(search), $options: "i" } },
        { "customer.email":     { $regex: escapeRegex(search), $options: "i" } },
        { "customer.city":      { $regex: escapeRegex(search), $options: "i" } },
        { "customer.phone":     { $regex: escapeRegex(search), $options: "i" } },
      ];
    }

    const sortObj = { [sortField]: sortDir === "asc" ? 1 : -1 };
    const skip    = (page - 1) * limit;

    const [orders, total, statsAgg, totalAll] = await Promise.all([
      Order.find(filter).populate("products.product").sort(sortObj).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
      Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Order.countDocuments(),
    ]);

    const stats = { total: totalAll, pending: 0, confirmed: 0, processing: 0, paid: 0, shipped: 0, delivered: 0, cancelled: 0 };
    statsAgg.forEach(s => { if (s._id in stats) stats[s._id] = s.count; });

    return NextResponse.json({
      orders,
      pagination: { total, totalPages: Math.ceil(total / limit), page, limit },
      stats,
    });
  } catch (error) {
    console.error("ADMIN ORDERS ERROR:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
