// app/api/order/route.js

import { NextResponse } from "next/server";
import { connectDB, isValidId } from "@/app/lib/db";
import Order from "@/app/models/Order";
import { sendEmail } from "@/app/lib/mailer";
import { getOrderConfirmationEmailTemplate, getAdminNewOrderEmailTemplate } from "@/app/lib/emailTemplates";
import Customer from "@/app/models/Customer";
import Promo from "@/app/models/Promo";

export async function POST(req) {
  console.log("🚀 API /api/order APPELÉE");
  
  try {
    await connectDB();

    const body = await req.json();
    const { customer, cartItems, total, payment, delivery, promoCode, discountAmount } = body;

    /* ======================
       VALIDATION CLIENT
    ====================== */
    if (!customer) {
      return NextResponse.json(
        { message: "Client manquant" },
        { status: 400 }
      );
    }

    const { firstname, lastname, email, city, address, phone, postalCode, country } = customer;

    if (!firstname || !lastname || !email || !city || !address) {
      return NextResponse.json(
        { message: "Informations client manquantes" },
        { status: 400 }
      );
    }

    // ✅ Validation email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Format d'email invalide" },
        { status: 400 }
      );
    }

    /* ======================
       VALIDATION PANIER
    ====================== */
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        { message: "Panier vide" },
        { status: 400 }
      );
    }

    /* ======================
       FORMAT PRODUITS
    ====================== */
    const products = cartItems.map((item) => {
      if (!isValidId(item._id)) {
        throw new Error("ID produit invalide");
      }

      return {
        product: item._id,
        quantity: Number(item.quantity) || 1,
      };
    });

    /* ======================
       CRÉATION COMMANDE
    ====================== */
    const deliveryMethod = delivery === "relais" ? "colissimo_relais" : "colissimo_domicile";

    const order = await Order.create({
      customer: {
        firstname,
        lastname,
        email,
        phone:      phone      || "",
        address,
        postalCode: postalCode || "",
        city,
        country:    country    || "",
      },
      products,
      total: Number(total),
      payment: payment || "cash",
      delivery: {
        method:         deliveryMethod,
        trackingNumber: null,
        labelUrl:       null,
        relayId:        null,
        shippedAt:      null,
      },
      status: "pending",
    });

    console.log("✅ Commande créée:", order._id);

    if (promoCode) {
      await Promo.findOneAndUpdate(
        { code: promoCode.toUpperCase() },
        { $inc: { usedCount: 1 } }
      );
    }
    /* ======================
   👤 SYNC CUSTOMER (IMPORTANT)
====================== */
const normalizedEmail = email.toLowerCase();

let existingCustomer = await Customer.findOne({ email: normalizedEmail });

if (existingCustomer) {
  existingCustomer.totalOrders += 1;
  existingCustomer.totalSpent += Number(total);
  existingCustomer.lastOrderAt = new Date();

  if (!existingCustomer.phone && phone) existingCustomer.phone = phone;
  if (!existingCustomer.city && city) existingCustomer.city = city;
  if (!existingCustomer.address && address) existingCustomer.address = address;

  await existingCustomer.save();
} else {
  await Customer.create({
    firstname,
    lastname,
    email: normalizedEmail,
    phone: phone || "",
    city: city || "",
    address: address || "",
    totalOrders: 1,
    totalSpent: Number(total),
    lastOrderAt: new Date(),
    status: "active",
  });
}


    /* ======================
       📧 PRÉPARATION DES EMAILS
    ====================== */
    const orderNumber = order._id.toString().slice(-8).toUpperCase();
    const orderDate = new Date().toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const paymentLabels = {
      cash: "💵 Espèces à la livraison",
      mobile_money: "📱 Mobile Money",
      card: "💳 Carte bancaire",
      bank_transfer: "🏦 Virement bancaire",
    };

    const deliveryLabels = {
      colissimo:          "📦 Colissimo — Livraison avec signature",
      relais:             "📦 Colissimo — Point relais",
      colissimo_domicile: "📦 Colissimo — Livraison avec signature",
      colissimo_relais:   "📦 Colissimo — Point relais",
      standard:           "🚚 Livraison standard",
      express:            "⚡ Livraison express",
      pickup:             "🏪 Retrait en magasin",
    };

    // Liste des produits formatée
    const productListHtml = cartItems.map((item) => `
      <tr style="border-bottom:1px solid #e2e8f0">
        <td style="padding:12px 8px 12px 0;vertical-align:top">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              ${item.image ? `<td style="padding-right:12px;vertical-align:top">
                <img src="${item.image}" width="48" height="60" alt="${item.name || ""}" style="display:block;border-radius:4px;object-fit:cover;border:1px solid #e2e8f0">
              </td>` : ""}
              <td style="vertical-align:top">
                <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a">${item.name || "Produit"}</p>
                ${item.size ? `<p style="margin:3px 0 0;font-size:12px;color:#94a3b8">Taille : ${item.size}</p>` : ""}
              </td>
            </tr>
          </table>
        </td>
        <td style="padding:12px 0;font-size:14px;color:#475569;text-align:center;vertical-align:top">${item.quantity}</td>
        <td style="padding:12px 0;font-size:14px;color:#475569;text-align:right;font-weight:600;vertical-align:top">${item.price ? Number(item.price).toLocaleString("fr-FR") + " €" : "-"}</td>
      </tr>
    `).join("");

    /* ======================
       📧 TEMPLATES EMAIL
    ====================== */
    const adminEmailHtml = getAdminNewOrderEmailTemplate({
      firstname,
      lastname,
      email,
      phone,
      orderNumber,
      orderDate,
      productListHtml,
      address,
      city,
      deliveryLabel: deliveryLabels[delivery] || deliveryLabels[deliveryMethod] || delivery,
      paymentLabel: paymentLabels[payment] || payment,
      total,
    });

    const clientEmailHtml = getOrderConfirmationEmailTemplate({
      firstname,
      orderNumber,
      orderDate,
      productListHtml,
      address,
      city,
      deliveryLabel: deliveryLabels[delivery] || deliveryLabels[deliveryMethod] || delivery,
      paymentLabel: paymentLabels[payment] || payment,
      total,
    });

    /* ======================
       📧 ENVOI DES EMAILS
    ====================== */
    let emailErrors = [];

    // 1️⃣ Email à l'ADMIN
    try {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
      console.log("📧 Envoi email ADMIN à:", adminEmail);

      await sendEmail({
        to: adminEmail,
        subject: `🛒 Nouvelle commande #${orderNumber} - ${firstname} ${lastname}`,
        html: adminEmailHtml,
      });

      console.log("✅ Email ADMIN envoyé avec succès");
    } catch (emailError) {
      console.error("❌ Erreur email ADMIN:", emailError.message);
      emailErrors.push({ type: "admin", error: emailError.message });
    }

    // 2️⃣ Email au CLIENT (✅ EMAIL DYNAMIQUE - tous les clients reçoivent !)
    try {
      console.log("📧 Envoi email CLIENT à:", email);

      await sendEmail({
        to: email, // ✅ L'email du client qui passe la commande
        subject: `✅ Confirmation de votre commande #${orderNumber}`,
        html: clientEmailHtml,
      });

      console.log("✅ Email CLIENT envoyé avec succès à:", email);
    } catch (emailError) {
      console.error("❌ Erreur email CLIENT:", emailError.message);
      emailErrors.push({ type: "client", error: emailError.message });
    }

    /* ======================
       ✅ RÉPONSE SUCCÈS
    ====================== */
    return NextResponse.json(
      {
        success: true,
        message: "Commande créée avec succès",
        order: {
          _id: order._id,
          orderNumber: orderNumber,
          total: order.total,
          status: order.status,
          createdAt: order.createdAt,
        },
        emailStatus: emailErrors.length === 0 ? "sent" : "partial",
        emailErrors: emailErrors.length > 0 ? emailErrors : undefined,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("❌ ORDER API ERROR:", error);

    // Erreur de validation Mongoose
    if (error.name === "ValidationError") {
      return NextResponse.json(
        {
          success: false,
          message: "Erreur de validation",
          errors: Object.values(error.errors).map((e) => e.message),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Erreur serveur",
      },
      { status: 500 }
    );
  }
}

/* ======================
   📋 GET - Liste des commandes (optionnel)
====================== */
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit")) || 50;

    const query = status ? { status } : {};

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("products.product")
      .lean();

    return NextResponse.json({
      success: true,
      count: orders.length,
      orders,
    });

  } catch (error) {
    console.error("❌ GET ORDERS ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
