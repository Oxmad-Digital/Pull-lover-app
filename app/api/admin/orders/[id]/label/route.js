// app/api/admin/orders/[id]/label/route.js
export const runtime = "nodejs";

import { NextResponse }      from "next/server";
import { getServerSession }  from "next-auth";
import { authOptions }       from "@/app/api/auth/[...nextauth]/route";
import { connectDB, isValidId } from "@/app/lib/db";
import Order                 from "@/app/models/Order";
import { generateLabel, getTrackingUrl, COLISSIMO_CONFIGURED } from "@/app/lib/colissimo";
import { sendEmail }         from "@/app/lib/mailer";
import { getOrderStatusUpdateEmailTemplate } from "@/app/lib/emailTemplates";
import { uploadToR2 } from "@/app/lib/r2";

export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Accès refusé" }, { status: 401 });
    }

    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ message: "ID invalide" }, { status: 400 });
    }

    if (!COLISSIMO_CONFIGURED) {
      return NextResponse.json(
        { message: "API Colissimo non configurée. Renseignez COLISSIMO_LOGIN et COLISSIMO_PASSWORD dans .env" },
        { status: 503 }
      );
    }

    await connectDB();
    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ message: "Commande introuvable" }, { status: 404 });
    }

    if (order.delivery?.trackingNumber) {
      return NextResponse.json(
        { message: "Une étiquette a déjà été générée pour cette commande", trackingNumber: order.delivery.trackingNumber },
        { status: 409 }
      );
    }

    const { trackingNumber, labelBase64 } = await generateLabel({
      orderId: order._id.toString(),
      method:  order.delivery?.method || "colissimo_domicile",
      addressee: {
        firstname:  order.customer.firstname,
        lastname:   order.customer.lastname,
        email:      order.customer.email,
        phone:      order.customer.phone,
        address:    order.customer.address,
        city:       order.customer.city,
        postalCode: order.customer.postalCode || "",
      },
      relayId: order.delivery?.relayId || undefined,
    });

    // Stocker le PDF sur R2 pour le conserver durablement
    let labelUrl = null;
    if (labelBase64) {
      try {
        const upload = await uploadToR2({
          key: "colissimo-labels/order_" + id + ".pdf",
          body: Buffer.from(labelBase64, "base64"),
          contentType: "application/pdf",
          cacheControl: "private, max-age=0, no-store",
        });
        labelUrl = upload.url;
      } catch {
        // L'URL restera null — le numéro de suivi est quand même enregistré
      }
    }

    const updated = await Order.findByIdAndUpdate(
      id,
      {
        status: "shipped",
        "delivery.trackingNumber": trackingNumber,
        "delivery.labelUrl":       labelUrl,
        "delivery.shippedAt":      new Date(),
      },
      { new: true }
    );

    // Email client avec numéro de suivi
    if (order.customer?.email) {
      const orderNumber = order._id.toString().slice(-8).toUpperCase();
      const trackingUrl = getTrackingUrl(trackingNumber);

      const html = getOrderStatusUpdateEmailTemplate({
        firstname:     order.customer.firstname || "Client",
        orderNumber,
        statusInfo:    { label: "Expédiée", icon: "🚚", color: "#06b6d4" },
        statusMessage: `Votre commande a été expédiée ! Numéro de suivi : <strong>${trackingNumber}</strong>`,
        address:       order.customer.address || "",
        city:          order.customer.city    || "",
        total:         order.total,
        orderUrl:      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders`,
        trackingNumber,
        trackingUrl,
      });

      await sendEmail({
        to:      order.customer.email,
        subject: `🚚 Commande #${orderNumber} expédiée — Suivi ${trackingNumber}`,
        html,
      });
    }

    return NextResponse.json({
      success:        true,
      trackingNumber,
      labelUrl,
      order:          updated,
    });
  } catch (error) {
    console.error("LABEL GENERATION ERROR:", error);

    if (error.message === "COLISSIMO_NON_CONFIGURE") {
      return NextResponse.json(
        { message: "Clés API Colissimo manquantes dans .env" },
        { status: 503 }
      );
    }

    return NextResponse.json({ message: error.message || "Erreur serveur" }, { status: 500 });
  }
}
