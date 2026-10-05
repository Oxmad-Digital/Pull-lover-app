import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Customer from "@/app/models/Customer";
import Order from "@/app/models/Order";
import { requireAdmin } from "@/app/lib/auth";
import { escapeRegex } from "@/app/lib/text";

/* =========================
   GET - Liste des clients
========================= */
export async function GET(req) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const vip    = searchParams.get("vip") || "";
    const sort   = searchParams.get("sort") || "createdAt";
    const order  = searchParams.get("order") || "desc";
    const page   = Math.max(1, parseInt(searchParams.get("page")) || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get("limit")) || 20));

    let query = {};

    if (search) {
      query.$or = [
        { firstname: { $regex: escapeRegex(search), $options: "i" } },
        { lastname: { $regex: escapeRegex(search), $options: "i" } },
        { email: { $regex: escapeRegex(search), $options: "i" } },
        { phone: { $regex: escapeRegex(search), $options: "i" } },
      ];
    }

    if (status) {
      query.status = status;
    }

    if (vip === "true") {
      query.totalSpent = { $gte: 50000 };
    }

    const total = await Customer.countDocuments(query);

    const customers = await Customer.find(query)
      .sort({ [sort]: order === "desc" ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET CUSTOMERS ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

/* =========================
   POST - Create / Sync
========================= */
export async function POST(req) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    await connectDB();
    const body = await req.json();

    if (body.action === "sync") {
      return await syncCustomersFromOrders();
    }

    const { firstname, lastname, email, phone, city, address } = body;
    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ success: false, message: "Email requis" }, { status: 400 });
    }

    const exists = await Customer.findOne({ email: email.toLowerCase() });
    if (exists) {
      return NextResponse.json(
        { success: false, message: "Ce client existe déjà" },
        { status: 400 }
      );
    }

    const customer = await Customer.create({
      firstname,
      lastname,
      email: email.toLowerCase(),
      phone,
      city,
      address,
    });

    return NextResponse.json(
      { success: true, customer },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST CUSTOMER ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

/* =========================
   SYNC CLIENTS (PRO & SAFE)
========================= */
async function syncCustomersFromOrders() {
  try {
    await connectDB();

    const orders = await Order.find({
      "customer.email": { $exists: true },
    }).sort({ createdAt: -1 });

    const customersMap = {};

    // Grouper les commandes par email
    for (const order of orders) {
      const email = order.customer.email.toLowerCase();

      if (!customersMap[email]) {
        customersMap[email] = {
          firstname: order.customer.firstname || "",
          lastname: order.customer.lastname || "",
          email,
          phone: order.customer.phone || "",
          city: order.customer.city || "",
          address: order.customer.address || "",
          totalOrders: 0,
          totalSpent: 0,
          lastOrderAt: order.createdAt,
        };
      }

      customersMap[email].totalOrders += 1;
      customersMap[email].totalSpent += order.total || 0;
    }

    let created = 0;
    let updated = 0;

    for (const email in customersMap) {
      const data = customersMap[email];

      const result = await Customer.findOneAndUpdate(
        { email },
        { $set: data },
        { upsert: true, new: true }
      );

      if (result.createdAt.getTime() === result.updatedAt.getTime()) {
        created++;
      } else {
        updated++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Synchronisation terminée",
      created,
      updated,
      total: created + updated,
    });
  } catch (error) {
    console.error("SYNC CUSTOMER ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
