import { NextResponse } from "next/server";
import { connectDB, isValidId } from "@/app/lib/db";
import Order from "@/app/models/Order";
import { sendEmail } from "@/app/lib/mailer";
import { getOrderConfirmationEmailTemplate } from "@/app/lib/emailTemplates";
import { carrierLabel } from "@/app/lib/sendcloud";
import { escapeHtml } from "@/app/lib/text";
import { requireAdmin } from "@/app/lib/auth";

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

    const paymentLabels = {
      cash: "💵 Espèces à la livraison",
      mobile_money: "📱 Mobile Money",
      card: "💳 Carte bancaire",
      bank_transfer: "🏦 Virement bancaire",
    };

    // `delivery` est un objet SendCloud (commandes récentes) ou une chaîne (anciennes commandes)
    const legacyDeliveryLabels = {
      standard: "🚚 Livraison standard",
      express: "⚡ Livraison express",
      pickup: "🏪 Retrait en magasin",
    };
    const deliveryLabel = delivery && typeof delivery === "object"
      ? `📦 ${carrierLabel(delivery.carrier)}${delivery.methodName ? ` — ${delivery.methodName}` : ""}`
      : legacyDeliveryLabels[delivery] || delivery || "";

    // `lines` fige nom, taille et prix payé au moment de la commande ; repli sur `products` pour les anciennes commandes
    const items = Array.isArray(order.lines) && order.lines.length
      ? order.lines
      : (products || []).map((item) => ({
          name: item.product?.name || "Produit",
          image: item.product?.image || "",
          size: item.size || "",
          quantity: item.quantity,
          unitPrice: item.product?.promoPrice ?? item.product?.price,
        }));

    const productListHtml = items.map((item) => `
      <tr style="border-bottom:1px solid #e2e8f0">
        <td style="padding:12px 8px 12px 0;vertical-align:top">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              ${item.image ? `<td style="padding-right:12px;vertical-align:top">
                <img src="${escapeHtml(item.image)}" width="48" height="60" alt="${escapeHtml(item.name)}" style="display:block;border-radius:4px;object-fit:cover;border:1px solid #e2e8f0">
              </td>` : ""}
              <td style="vertical-align:top">
                <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a">${escapeHtml(item.name || "Produit")}</p>
                ${item.size ? `<p style="margin:3px 0 0;font-size:12px;color:#94a3b8">Taille : ${escapeHtml(item.size)}</p>` : ""}
              </td>
            </tr>
          </table>
        </td>
        <td style="padding:12px 0;font-size:14px;color:#475569;text-align:center;vertical-align:top">${Number(item.quantity) || 1}</td>
        <td style="padding:12px 0;font-size:14px;color:#475569;text-align:right;font-weight:600;vertical-align:top">${item.unitPrice != null ? Number(item.unitPrice).toLocaleString("fr-FR") + " €" : "-"}</td>
      </tr>
    `).join("");

    const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString("fr-FR", {
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
      paymentLabel: paymentLabels[payment] || payment,
      total,
    });

    // 4. Envoi de l'email
    await sendEmail({
      to: customer.email,
      subject: `Récapitulatif de votre commande #${orderNumber} — Pull-Lover`,
      html: clientEmailHtml,
    });

    return NextResponse.json({ success: true, message: "Email renvoyé avec succès" });

  } catch (error) {
    console.error("RESEND ERROR:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}