// app/api/order/route.js

import { NextResponse, after } from "next/server";
import { connectDB } from "@/app/lib/db";
import Order from "@/app/models/Order";
import { sendEmail, adminEmail, ordersPageUrl } from "@/app/lib/mailer";
import { getOrderConfirmationEmailTemplate, getAdminNewOrderEmailTemplate, orderItemsHtml } from "@/app/lib/emailTemplates";
import Customer from "@/app/models/Customer";
import Settings from "@/app/models/Settings";
import { computeOrderTotals, CheckoutError } from "@/app/lib/checkoutPricing";
import { escapeHtml } from "@/app/lib/text";
import { shippingLabel } from "@/app/lib/shipping-label";
import { requireAdmin } from "@/app/lib/auth";
import Stripe from "stripe";
import { translator } from "@/app/i18n/server";
import { INTL_LOCALE } from "@/app/i18n/config.mjs";
import { paymentLabel } from "@/app/i18n/orders.mjs";

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
  let t = translator(req);

  try {
    await connectDB();

    const body = await req.json();
    const { customer, cartItems, delivery, promoCode, stripePaymentId } = body;
    // Langue du client : messages de cette réponse et e-mails de confirmation / suivi
    t = translator(req, body.locale);
    const lang = t.lang;

    /* ======================
       VALIDATION CLIENT
    ====================== */
    if (!customer) {
      return NextResponse.json(
        { message: t("Client manquant", "Missing customer details") },
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
        { message: t("Informations client manquantes", "Missing customer information") },
        { status: 400 }
      );
    }

    // ✅ Validation email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: t("Format d'email invalide", "Invalid email format") },
        { status: 400 }
      );
    }

    /* ======================
       VALIDATION PANIER
    ====================== */
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        { message: t("Panier vide", "Your cart is empty") },
        { status: 400 }
      );
    }

    /* ======================
       PAIEMENT STRIPE (obligatoire, vérifié côté serveur)
    ====================== */
    if (!stripePaymentId || typeof stripePaymentId !== "string") {
      return NextResponse.json({ message: t("Paiement manquant", "Missing payment") }, { status: 402 });
    }

    // Idempotence : un même paiement ne crée qu'une seule commande
    const already = await Order.findOne({ stripePaymentId });
    if (already) {
      return NextResponse.json(
        { success: true, message: t("Commande déjà enregistrée", "Order already saved"), order: orderSummary(already) },
        { status: 200 }
      );
    }

    let totals;
    try {
      // Le client a déjà payé : une rupture de stock survenue entre-temps est signalée à l'admin
      // au lieu de bloquer l'enregistrement (le montant reste vérifié contre Stripe ci-dessous).
      totals = await computeOrderTotals({ cartItems, promoCode, delivery, allowStockShortage: true, lang });
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
      return NextResponse.json({ message: t("Paiement non confirmé", "Payment not confirmed") }, { status: 402 });
    }
    if (paymentIntent.currency !== "eur" || paymentIntent.amount_received !== Math.round(total * 100)) {
      console.error("❌ Montant Stripe ≠ panier", paymentIntent.id, paymentIntent.amount_received, total);
      return NextResponse.json({ message: t("Le montant payé ne correspond pas au panier", "The amount paid doesn't match the cart") }, { status: 409 });
    }

    const products = lines.map((l) => ({ product: l.product, quantity: l.quantity }));

    /* ======================
       CRÉATION COMMANDE
    ====================== */
    const servicePoint = shippingMethod.servicePoint ? delivery?.servicePoint : null;
    if (shippingMethod.servicePoint && !servicePoint?.id) {
      return NextResponse.json({ message: t("Veuillez choisir un point relais", "Please choose a pickup point") }, { status: 400 });
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
      locale: lang,
    });
    } catch (err) {
      // Index unique sur stripePaymentId : une requête simultanée a déjà créé la commande
      if (err.code === 11000) {
        const existing = await Order.findOne({ stripePaymentId });
        if (existing) {
          return NextResponse.json(
            { success: true, message: t("Commande déjà enregistrée", "Order already saved"), order: orderSummary(existing) },
            { status: 200 }
          );
        }
      }
      throw err;
    }

    console.log("✅ Commande créée:", order._id);

    const sql = await connectDB();

    // Compteur promo, stock et fiche client sont indépendants : écrits en parallèle
    const [promoRows] = await Promise.all([
      // Incrément atomique et borné du compteur d'utilisation du code promo : deux commandes
      // simultanées ne peuvent pas dépasser maxUses (aucune ligne renvoyée si le quota est atteint)
      totals.promoCode && sql`
        UPDATE promos
        SET data = jsonb_set(data, '{usedCount}', to_jsonb(COALESCE((data->>'usedCount')::int, 0) + 1))
        WHERE data->>'code' = ${totals.promoCode}
          AND (jsonb_typeof(data->'maxUses') IS DISTINCT FROM 'number'
               OR COALESCE((data->>'usedCount')::int, 0) < (data->>'maxUses')::int)
        RETURNING id
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
    // Commande déjà payée : un quota promo dépassé entre-temps est signalé à l'admin
    const promoOverused = Boolean(totals.promoCode) && !promoRows?.length;
    const notices = [
      ...(totals.shortages.length
        ? [`<strong>⚠️ Rupture de stock au moment de l'enregistrement :</strong><br>${totals.shortages.map(escapeHtml).join("<br>")}`]
        : []),
      ...(promoOverused
        ? [`<strong>⚠️ Code promo ${escapeHtml(totals.promoCode)} utilisé au-delà de son quota</strong> (commandes simultanées).`]
        : []),
    ];

    const orderNumber = order._id.toString().slice(-8).toUpperCase();
    const dateFor = (locale) => new Date().toLocaleDateString(INTL_LOCALE[locale], {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const deliveryLabel = `📦 ${shippingLabel({ ...shippingMethod, relay: Boolean(shippingMethod.servicePoint) }, "fr")}`;
    // Articles : en français pour l'admin, dans la langue du client pour sa confirmation
    const clientLines = lang === "en" ? lines.map((line) => ({ ...line, name: line.nameEn || line.name })) : lines;

    /* ======================
       📧 TEMPLATES EMAIL
    ====================== */
    const adminEmailHtml = getAdminNewOrderEmailTemplate({
      firstname,
      lastname,
      email,
      phone,
      orderNumber,
      orderDate: dateFor("fr"),
      productListHtml: orderItemsHtml(lines),
      address,
      city,
      deliveryLabel,
      paymentLabel: `💳 ${paymentLabel("card", "fr")}`,
      total,
      notice: notices.join("<br><br>"),
    });

    const clientEmailHtml = getOrderConfirmationEmailTemplate({
      firstname,
      orderNumber,
      orderDate: dateFor(lang),
      productListHtml: orderItemsHtml(clientLines, lang),
      address,
      city,
      deliveryLabel,
      paymentLabel: `💳 ${paymentLabel("card", lang)}`,
      total,
      orderUrl: ordersPageUrl(lang),
      lang,
    });

    /* ======================
       📧 ENVOI DES EMAILS (après la réponse : le client n'attend pas le SMTP)
    ====================== */
    after(async () => {
      const [adminResult, clientResult] = await Promise.allSettled([
        sendEmail({
          to: adminEmail(),
          subject: `🛒 Nouvelle commande #${orderNumber} - ${firstname} ${lastname}`,
          html: adminEmailHtml,
        }),
        sendEmail({
          to: email,
          subject: t(`✅ Confirmation de votre commande #${orderNumber}`, `✅ Your order confirmation #${orderNumber}`),
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
        message: t("Commande créée avec succès", "Order created successfully"),
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
          message: t("Erreur de validation", "Validation error"),
          errors: Object.values(error.errors).map((e) => e.message),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: t("Erreur serveur lors de l'enregistrement de la commande", "Server error while saving the order") },
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
