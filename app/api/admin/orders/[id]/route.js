// app/api/admin/orders/[id]/route.js
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB, isValidId } from "@/app/lib/db";
import Order from "@/app/models/Order";
import { requireAdmin } from "@/app/lib/auth";
import { sendEmail } from "@/app/lib/mailer";
import { getOrderStatusUpdateEmailTemplate } from "@/app/lib/emailTemplates";
import { toLocale, tr } from "@/app/i18n/config.mjs";
import { orderStatusLabel, orderStatusMessage } from "@/app/i18n/orders.mjs";

// ✅ GET - Récupérer les détails d'une commande

// ✅ AJOUTER CETTE FONCTION GET
export async function GET(req, { params }) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    await connectDB();

    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json({ message: "ID invalide" }, { status: 400 });
    }

    const order = await Order.findById(id).populate("products.product");

    if (!order) {
      return NextResponse.json({ message: "Commande introuvable" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("GET ORDER ERROR:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

// ✅ PATCH - Mettre à jour le statut (votre code existant)
export async function PATCH(req, { params }) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    await connectDB();

    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json({ message: "ID invalide" }, { status: 400 });
    }

    const { status } = await req.json();

    const allowedStatus = [
      "pending",
      "confirmed",
      "processing",
      "paid",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!allowedStatus.includes(status)) {
      return NextResponse.json({ message: "Statut invalide" }, { status: 400 });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!order) {
      return NextResponse.json({ message: "Commande introuvable" }, { status: 404 });
    }

    /* ======================
       📧 EMAIL AU CLIENT
    ====================== */
    const statusStyles = {
      pending: { icon: "⏳", color: "#f59e0b" },
      confirmed: { icon: "✔️", color: "#3b82f6" },
      processing: { icon: "📦", color: "#8b5cf6" },
      paid: { icon: "💰", color: "#10b981" },
      shipped: { icon: "🚚", color: "#06b6d4" },
      delivered: { icon: "✅", color: "#22c55e" },
      cancelled: { icon: "❌", color: "#ef4444" },
    };

    // E-mail dans la langue de la commande (anciennes commandes : français)
    const lang = toLocale(order.locale);
    const statusInfo = { ...statusStyles[status], label: orderStatusLabel(status, lang) };
    const orderNumber = order._id.toString().slice(-8).toUpperCase();

    const clientEmailHtml = getOrderStatusUpdateEmailTemplate({
      firstname: order.customer?.firstname || tr(lang, "Client", "Customer"),
      orderNumber,
      statusInfo,
      statusMessage: orderStatusMessage(status, lang),
      address: order.customer?.address || "",
      city: order.customer?.city || "",
      total: order.total,
      lang,
    });

    if (order.customer?.email) {
      await sendEmail({
        to: order.customer.email,
        subject: `${statusInfo.icon} ${tr(lang, "Commande", "Order")} #${orderNumber} - ${statusInfo.label}`,
        html: clientEmailHtml,
      });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("PATCH ORDER ERROR:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

// ✅ DELETE - Supprimer une commande
export async function DELETE(req, { params }) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    await connectDB();

    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json({ message: "ID invalide" }, { status: 400 });
    }

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json({ message: "Commande introuvable" }, { status: 404 });
    }

    // ⚠️ Empêcher la suppression de commandes payées ou expédiées
    const protectedStatus = ["paid", "shipped", "delivered"];
    if (protectedStatus.includes(order.status)) {
      return NextResponse.json(
        { message: `Impossible de supprimer une commande ${order.status}` },
        { status: 400 }
      );
    }

    await Order.findByIdAndDelete(id);

    return NextResponse.json({ message: "Commande supprimée avec succès" });
  } catch (error) {
    console.error("DELETE ORDER ERROR:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
