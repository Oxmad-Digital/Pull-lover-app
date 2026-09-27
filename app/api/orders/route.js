// app/api/order/route.js

import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Order from "@/app/models/Order";
import { sendEmail } from "@/app/lib/mailer";
import { getOrderConfirmationEmailTemplate, getAdminNewOrderEmailTemplate } from "@/app/lib/emailTemplates";
import Customer from "@/app/models/Customer";
import Settings from "@/app/models/Settings";
import Product from "@/app/models/Product";
import { computeOrderTotals, CheckoutError } from "@/app/lib/checkoutPricing";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Stripe from "stripe";

const escapeHtml = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export async function POST(req) {
  console.log("🚀 API /api/order APPELÉE");
  
  try {
    await connectDB();

    const body = await req.json();
    const { customer, cartItems, delivery, promoCode, stripePaymentId } = body;

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

    if (!firstname || !lastname || !email || !city || !address || !postalCode || !phone) {
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
       PAIEMENT STRIPE (obligatoire, vérifié côté serveur)
    ====================== */
    if (!stripePaymentId || typeof stripePaymentId !== "string") {
      return NextResponse.json({ message: "Paiement manquant" }, { status: 402 });
    }

    // Idempotence : un même paiement ne crée qu'une seule commande
    const already = await Order.findOne({ stripePaymentId });
    if (already) {
      return NextResponse.json(
        {
          success: true,
          message: "Commande déjà enregistrée",
          order: { _id: already._id, orderNumber: already._id.toString().slice(-8).toUpperCase(), total: already.total, status: already.status },
        },
        { status: 200 }
      );
    }

    let totals;
    try {
      totals = await computeOrderTotals({ cartItems, promoCode, delivery });
    } catch (err) {
      if (err instanceof CheckoutError) {
        return NextResponse.json({ message: err.message }, { status: err.status });
      }
      throw err;
    }
    const { lines, total, shippingMethod, weight, countryCode } = totals;

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentId);
    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json({ message: "Paiement non confirmé" }, { status: 402 });
    }
    if (paymentIntent.currency !== "eur" || paymentIntent.amount_received !== Math.round(total * 100)) {
      console.error("❌ Montant Stripe ≠ panier", paymentIntent.id, paymentIntent.amount_received, total);
      return NextResponse.json({ message: "Le montant payé ne correspond pas au panier" }, { status: 409 });
    }

    const products = lines.map((l) => ({ product: l.product, quantity: l.quantity }));

    /* ======================
       CRÉATION COMMANDE
    ====================== */
    const servicePoint = shippingMethod.servicePoint ? delivery?.servicePoint : null;
    if (shippingMethod.servicePoint && !servicePoint?.id) {
      return NextResponse.json({ message: "Veuillez choisir un point relais" }, { status: 400 });
    }

    // Drop : les données de livraison restent chez nous jusqu'à la fin de la période de drop
    const settings = await Settings.findOne();
    const releaseDate = settings?.shippingReleaseDate ? new Date(settings.shippingReleaseDate) : null;
    const releaseAt = releaseDate && releaseDate > new Date() ? releaseDate : null;

    const order = await Order.create({
      customer: {
        firstname,
        lastname,
        email,
        phone:      phone      || "",
        company:    customer.company || "",
        address,
        postalCode: postalCode || "",
        city,
        country:    country    || "",
      },
      products,
      total,
      stripePaymentId,
      payment: "card",
      promoCode: totals.promoCode,
      discountAmount: totals.discount,
      lines,
      delivery: {
        method:         `${shippingMethod.carrier}${shippingMethod.servicePoint ? "_relais" : "_domicile"}`,
        methodId:       shippingMethod.methodId,
        methodName:     shippingMethod.name,
        weight,
        carrier:        shippingMethod.carrier,
        countryCode,
        trackingNumber: null,
        trackingUrl:    null,
        labelUrl:       null,
        relayId:        servicePoint ? String(servicePoint.id) : null,
        servicePoint:   servicePoint
          ? {
              id:         String(servicePoint.id),
              name:       String(servicePoint.name || ""),
              street:     String(servicePoint.street || ""),
              postalCode: String(servicePoint.postalCode || ""),
              city:       String(servicePoint.city || ""),
            }
          : null,
        releaseAt,
        shippedAt:      null,
      },
      status: "paid",
    });

    console.log("✅ Commande créée:", order._id);

    // Incrément atomique du compteur d'utilisation du code promo
    if (totals.promoCode) {
      const sql = await connectDB();
      await sql`
        UPDATE promos
        SET data = jsonb_set(data, '{usedCount}', to_jsonb(COALESCE((data->>'usedCount')::int, 0) + 1))
        WHERE data->>'code' = ${totals.promoCode}
      `;
    }

    // Décrément du stock (par taille si renseignée)
    for (const l of lines) {
      try {
        const product = await Product.findById(l.product);
        if (!product) continue;
        const stocks = { ...(product.stocks || {}) };
        if (l.size && Number.isFinite(Number(stocks[l.size]))) {
          stocks[l.size] = Math.max(0, Number(stocks[l.size]) - l.quantity);
        }
        const stock = Math.max(0, (Number(product.stock) || 0) - l.quantity);
        await Product.findByIdAndUpdate(l.product, { stock, stocks, isAvailable: stock > 0 });
      } catch (err) {
        console.error("❌ Décrément stock:", l.product, err.message);
      }
    }

    /* ======================
   👤 SYNC CUSTOMER (IMPORTANT)
====================== */
const normalizedEmail = email.toLowerCase();

let existingCustomer = await Customer.findOne({ email: normalizedEmail });

if (existingCustomer) {
  existingCustomer.totalOrders += 1;
  existingCustomer.totalSpent += total;
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
    totalSpent: total,
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

    const deliveryLabel = `📦 ${shippingMethod.carrierLabel} — ${shippingMethod.name}`;

    // Liste des produits formatée
    const productListHtml = lines.map((item) => `
      <tr style="border-bottom:1px solid #e2e8f0">
        <td style="padding:12px 8px 12px 0;vertical-align:top">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              ${item.image ? `<td style="padding-right:12px;vertical-align:top">
                <img src="${escapeHtml(item.image)}" width="48" height="60" alt="${escapeHtml(item.name)}" style="display:block;border-radius:4px;object-fit:cover;border:1px solid #e2e8f0">
              </td>` : ""}
              <td style="vertical-align:top">
                <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a">${escapeHtml(item.name)}</p>
                ${item.size ? `<p style="margin:3px 0 0;font-size:12px;color:#94a3b8">Taille : ${escapeHtml(item.size)}</p>` : ""}
              </td>
            </tr>
          </table>
        </td>
        <td style="padding:12px 0;font-size:14px;color:#475569;text-align:center;vertical-align:top">${item.quantity}</td>
        <td style="padding:12px 0;font-size:14px;color:#475569;text-align:right;font-weight:600;vertical-align:top">${Number(item.unitPrice).toLocaleString("fr-FR")} €</td>
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
      deliveryLabel,
      paymentLabel: paymentLabels.card,
      total,
    });

    const clientEmailHtml = getOrderConfirmationEmailTemplate({
      firstname,
      orderNumber,
      orderDate,
      productListHtml,
      address,
      city,
      deliveryLabel,
      paymentLabel: paymentLabels.card,
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
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Accès refusé" }, { status: 401 });
    }
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
