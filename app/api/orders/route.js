// app/api/order/route.js

import { NextResponse, after } from "next/server";
import { connectDB } from "@/app/lib/db";
import Order from "@/app/models/Order";
import { sendEmail } from "@/app/lib/mailer";
import { getOrderConfirmationEmailTemplate, getAdminNewOrderEmailTemplate } from "@/app/lib/emailTemplates";
import Customer from "@/app/models/Customer";
import Settings from "@/app/models/Settings";
import { computeOrderTotals, CheckoutError } from "@/app/lib/checkoutPricing";
import { escapeHtml } from "@/app/lib/text";
import { requireAdmin } from "@/app/lib/auth";
import Stripe from "stripe";

const cleanText = (value) => (typeof value === "string" ? value.trim() : "");

const orderSummary = (order) => ({
  _id: order._id,
  orderNumber: order._id.toString().slice(-8).toUpperCase(),
  total: order.total,
  status: order.status,
});

/** Décrément atomique du stock (global et par taille) : pas de perte de mise à jour entre commandes simultanées. */
async function decrementStock(sql, { product, size, quantity }) {
  await sql`
    UPDATE products SET
      data = data
        || jsonb_build_object(
             'stock', GREATEST(0, COALESCE((data->>'stock')::numeric, 0) - ${quantity}::int),
             'isAvailable', GREATEST(0, COALESCE((data->>'stock')::numeric, 0) - ${quantity}::int) > 0
           )
        || CASE WHEN ${size}::text <> '' AND jsonb_typeof(data->'stocks') = 'object' AND (data->'stocks') ? ${size}::text
             THEN jsonb_build_object('stocks', (data->'stocks') || jsonb_build_object(
               ${size}::text, GREATEST(0, COALESCE((data->'stocks'->>${size}::text)::numeric, 0) - ${quantity}::int)))
             ELSE '{}'::jsonb END,
      updated_at = now()
    WHERE id = ${product}::uuid
  `;
}

/** Crée ou met à jour la fiche client à partir de la commande. */
async function syncCustomer({ firstname, lastname, email, phone, city, address, total }) {
  const existingCustomer = await Customer.findOne({ email });

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
      email,
      phone: phone || "",
      city: city || "",
      address: address || "",
      totalOrders: 1,
      totalSpent: total,
      lastOrderAt: new Date(),
      status: "active",
    });
  }
}

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

    // Champs forcés en chaînes : un objet JSON ne doit jamais atteindre la base ni les emails
    const firstname = cleanText(customer.firstname);
    const lastname = cleanText(customer.lastname);
    const email = cleanText(customer.email).toLowerCase();
    const city = cleanText(customer.city);
    const address = cleanText(customer.address);
    const phone = cleanText(customer.phone);
    const postalCode = cleanText(customer.postalCode);
    const country = cleanText(customer.country);
    const company = cleanText(customer.company);

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
        { success: true, message: "Commande déjà enregistrée", order: orderSummary(already) },
        { status: 200 }
      );
    }

    let totals;
    try {
      // Le client a déjà payé : une rupture de stock survenue entre-temps est signalée à l'admin
      // au lieu de bloquer l'enregistrement (le montant reste vérifié contre Stripe ci-dessous).
      totals = await computeOrderTotals({ cartItems, promoCode, delivery, allowStockShortage: true });
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

    let order;
    try {
    order = await Order.create({
      customer: {
        firstname,
        lastname,
        email,
        phone:      phone      || "",
        company,
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
      stockShortages: totals.shortages,
      status: "paid",
    });
    } catch (err) {
      // Index unique sur stripePaymentId : une requête simultanée a déjà créé la commande
      if (err.code === 11000) {
        const existing = await Order.findOne({ stripePaymentId });
        if (existing) {
          return NextResponse.json(
            { success: true, message: "Commande déjà enregistrée", order: orderSummary(existing) },
            { status: 200 }
          );
        }
      }
      throw err;
    }

    console.log("✅ Commande créée:", order._id);

    const sql = await connectDB();

    // Compteur promo, stock et fiche client sont indépendants : écrits en parallèle
    await Promise.all([
      // Incrément atomique du compteur d'utilisation du code promo
      totals.promoCode && sql`
        UPDATE promos
        SET data = jsonb_set(data, '{usedCount}', to_jsonb(COALESCE((data->>'usedCount')::int, 0) + 1))
        WHERE data->>'code' = ${totals.promoCode}
      `,
      // Décrément du stock (par taille si renseignée) : chaque UPDATE est atomique
      ...lines.map((l) =>
        decrementStock(sql, l).catch((err) => console.error("❌ Décrément stock:", l.product, err.message))
      ),
      syncCustomer({ firstname, lastname, email, phone, city, address, total }),
    ]);

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
    const shortageHtml = totals.shortages.length
      ? `<p style="margin:16px 0;padding:12px;background:#fef2f2;color:#991b1b;border-radius:8px;font-size:14px"><strong>⚠️ Rupture de stock au moment de l'enregistrement :</strong><br>${totals.shortages.map(escapeHtml).join("<br>")}</p>`
      : "";

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
       📧 ENVOI DES EMAILS (après la réponse : le client n'attend pas le SMTP)
    ====================== */
    after(async () => {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
      const [adminResult, clientResult] = await Promise.allSettled([
        sendEmail({
          to: adminEmail,
          subject: `🛒 Nouvelle commande #${orderNumber} - ${firstname} ${lastname}`,
          html: shortageHtml ? adminEmailHtml.replace(/<body[^>]*>/, (tag) => tag + shortageHtml) : adminEmailHtml,
        }),
        sendEmail({
          to: email,
          subject: `✅ Confirmation de votre commande #${orderNumber}`,
          html: clientEmailHtml,
        }),
      ]);
      if (adminResult.status === "rejected") console.error("❌ Erreur email ADMIN:", adminResult.reason?.message);
      if (clientResult.status === "rejected") console.error("❌ Erreur email CLIENT:", clientResult.reason?.message);
    });

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
      { success: false, message: "Erreur serveur lors de l'enregistrement de la commande" },
      { status: 500 }
    );
  }
}

/* ======================
   📋 GET - Liste des commandes (optionnel)
====================== */
export async function GET(req) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;
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
