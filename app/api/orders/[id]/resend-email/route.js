import { NextResponse } from "next/server";
import { connectDB, isValidId } from "@/app/lib/db";
import Order from "@/app/models/Order";
import { sendEmail } from "@/app/lib/mailer";
import { getOrderConfirmationEmailTemplate, orderItemsHtml } from "@/app/lib/emailTemplates";
import { carrierLabel } from "@/app/lib/sendcloud";
import { requireAdmin } from "@/app/lib/auth";
import { INTL_LOCALE, toLocale, tr } from "@/app/i18n/config.mjs";
import { paymentLabel } from "@/app/i18n/orders.mjs";
import { localizeProduct } from "@/app/i18n/product.mjs";

export async function POST(req, { params }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    await connectDB();
    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json({ success: false, message: "ID invalide" }, { status: 400 });
    }

    // 1. Récupérer la commande avec les détails des produits
    const order = await Order.findById(id).populate("products.product").lean();

    if (!order) {
      return NextResponse.json({ success: false, message: "Commande non trouvée" }, { status: 404 });
    }

    // 2. Préparer les variables (mêmes données que l'email de confirmation initial)
    const orderNumber = order._id.toString().slice(-8).toUpperCase();
    const { customer, products, total, payment, delivery } = order;
    // Renvoyé dans la langue de la commande (anciennes commandes : français)
    const lang = toLocale(order.locale);

    const paymentIcons = { cash: "💵", mobile_money: "📱", card: "💳", bank_transfer: "🏦" };

    // `delivery` est un objet SendCloud (commandes récentes) ou une chaîne (anciennes commandes)
    const legacyDeliveryLabels = {
      standard: tr(lang, "🚚 Livraison standard", "🚚 Standard delivery"),
      express: tr(lang, "⚡ Livraison express", "⚡ Express delivery"),
      pickup: tr(lang, "🏪 Retrait en magasin", "🏪 In-store pickup"),
    };
    const deliveryLabel = delivery && typeof delivery === "object"
      ? `📦 ${carrierLabel(delivery.carrier)}${delivery.methodName ? ` — ${delivery.methodName}` : ""}`
      : legacyDeliveryLabels[delivery] || delivery || "";

    // `lines` fige nom, taille et prix payé au moment de la commande ; repli sur `products` pour les anciennes commandes
    const items = Array.isArray(order.lines) && order.lines.length
      ? order.lines.map((line) => ({ ...line, name: (lang === "en" && line.nameEn) || line.name }))
      : (products || []).map((item) => ({
          name: localizeProduct(item.product, lang)?.name || "",
          image: item.product?.image || "",
          size: item.size || "",
          quantity: item.quantity,
          unitPrice: item.product?.promoPrice ?? item.product?.price,
        }));

    const productListHtml = orderItemsHtml(items, lang);

    const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString(INTL_LOCALE[lang], {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    const clientEmailHtml = getOrderConfirmationEmailTemplate({
      firstname: customer.firstname,
      orderNumber,
      orderDate,
      productListHtml,
      address: customer.address,
      city: customer.city,
      deliveryLabel,
      paymentLabel: paymentIcons[payment] ? `${paymentIcons[payment]} ${paymentLabel(payment, lang)}` : payment,
      total,
      lang,
    });

    // 4. Envoi de l'email
    await sendEmail({
      to: customer.email,
      subject: tr(lang, `Récapitulatif de votre commande #${orderNumber} — Pull-Lover`, `Your order summary #${orderNumber} — Pull-Lover`),
      html: clientEmailHtml,
    });

    return NextResponse.json({ success: true, message: "Email renvoyé avec succès" });

  } catch (error) {
    console.error("RESEND ERROR:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}