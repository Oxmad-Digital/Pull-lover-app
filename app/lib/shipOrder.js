// app/lib/shipOrder.js
// Annonce une commande au transporteur via SendCloud : création du colis + étiquette
// (le transporteur reçoit alors les données de livraison du client), puis email de suivi.
// ⚠️ Action irréversible côté transporteur — ne l'appeler qu'à la fin de la période de drop.

import Order from "@/app/models/Order";
import { connectDB } from "@/app/lib/db";
import { createParcel } from "@/app/lib/sendcloud";
import { sendEmail } from "@/app/lib/mailer";
import { getOrderStatusUpdateEmailTemplate } from "@/app/lib/emailTemplates";
import { uploadToR2 } from "@/app/lib/r2";

export class ShipError extends Error {
  constructor(message, status = 400, extra = {}) {
    super(message);
    this.status = status;
    Object.assign(this, extra);
  }
}

// Durée au-delà de laquelle un verrou d'expédition abandonné (crash en cours de route) est ignoré
const SHIP_LOCK_MINUTES = 5;

/**
 * Réserve atomiquement la commande pour l'expédition : empêche deux créations de colis
 * simultanées (double clic, cron + action manuelle). Retourne false si déjà réservée.
 */
async function claimShipment(id) {
  const sql = await connectDB();
  const rows = await sql`
    UPDATE orders
    SET data = jsonb_set(data, '{delivery,shipLockAt}', to_jsonb(now()::text)), updated_at = now()
    WHERE id = ${id}::uuid
      AND jsonb_typeof(data->'delivery') = 'object'
      AND COALESCE(data->'delivery'->>'trackingNumber', '') = ''
      AND (
        data->'delivery'->>'shipLockAt' IS NULL
        OR (data->'delivery'->>'shipLockAt')::timestamptz < now() - make_interval(mins => ${SHIP_LOCK_MINUTES}::int)
      )
    RETURNING id
  `;
  return rows.length > 0;
}

async function releaseShipment(id) {
  const sql = await connectDB();
  await sql`
    UPDATE orders SET data = data #- '{delivery,shipLockAt}'
    WHERE id = ${id}::uuid AND jsonb_typeof(data->'delivery') = 'object'
  `;
}

/** Date avant laquelle la commande ne doit pas partir chez le transporteur (ou null). */
export function holdUntil(order) {
  const releaseAt = order.delivery?.releaseAt ? new Date(order.delivery.releaseAt) : null;
  return releaseAt && releaseAt > new Date() ? releaseAt : null;
}

/**
 * @param {object} order   document Order
 * @param {{ force?: boolean }} opts  force = expédier avant la fin de la période de drop
 */
export async function shipOrder(order, { force = false } = {}) {
  const id = order._id.toString();

  if (order.status === "cancelled" || order.status === "delivered") {
    throw new ShipError("Commande annulée ou déjà livrée", 422);
  }
  if (order.delivery?.trackingNumber) {
    throw new ShipError("Une étiquette a déjà été générée pour cette commande", 409, {
      trackingNumber: order.delivery.trackingNumber,
    });
  }
  if (!order.delivery?.methodId) {
    throw new ShipError("Cette commande n'a pas de mode d'expédition SendCloud (ancienne commande)", 422);
  }
  const hold = holdUntil(order);
  if (hold && !force) {
    throw new ShipError(
      `Période de drop en cours : expédition prévue à partir du ${hold.toLocaleDateString("fr-FR")}`,
      423,
      { releaseAt: hold }
    );
  }

  if (!(await claimShipment(id))) {
    throw new ShipError("Une expédition est déjà en cours ou terminée pour cette commande", 409);
  }

  let parcel;
  try {
    parcel = await createParcel({
      orderId: id,
      methodId: order.delivery.methodId,
      weight: Number(order.delivery.weight) || undefined,
      addressee: {
        name: `${order.customer.firstname} ${order.customer.lastname}`.trim(),
        company: order.customer.company,
        email: order.customer.email,
        phone: order.customer.phone,
        address: order.customer.address,
        city: order.customer.city,
        postalCode: order.customer.postalCode || "",
        countryCode: order.delivery.countryCode || "FR",
      },
      servicePointId: order.delivery.relayId || undefined,
    });
  } catch (err) {
    // Colis non créé : la commande redevient expédiable
    await releaseShipment(id).catch(() => {});
    throw err;
  }
  const { trackingNumber, trackingUrl, labelBuffer } = parcel;

  let labelUrl = null;
  if (labelBuffer) {
    try {
      const upload = await uploadToR2({
        key: "shipping-labels/order_" + id + ".pdf",
        body: labelBuffer,
        contentType: "application/pdf",
        cacheControl: "private, max-age=0, no-store",
      });
      labelUrl = upload.url;
    } catch {
      // Le numéro de suivi est quand même enregistré
    }
  }

  const updated = await Order.findByIdAndUpdate(
    id,
    {
      status: "shipped",
      "delivery.trackingNumber": trackingNumber,
      "delivery.trackingUrl": trackingUrl,
      "delivery.labelUrl": labelUrl,
      "delivery.shippedAt": new Date(),
      "delivery.shipLockAt": null,
    },
    { new: true }
  );

  if (order.customer?.email) {
    try {
      const orderNumber = id.slice(-8).toUpperCase();
      const html = getOrderStatusUpdateEmailTemplate({
        firstname: order.customer.firstname || "Client",
        orderNumber,
        statusInfo: { label: "Expédiée", icon: "🚚", color: "#06b6d4" },
        statusMessage: `Votre commande a été expédiée ! Numéro de suivi : <strong>${trackingNumber}</strong>`,
        address: order.customer.address || "",
        city: order.customer.city || "",
        total: order.total,
        orderUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders`,
        trackingNumber,
        trackingUrl,
      });
      await sendEmail({
        to: order.customer.email,
        subject: `🚚 Commande #${orderNumber} expédiée — Suivi ${trackingNumber}`,
        html,
      });
    } catch (err) {
      console.error("❌ Email suivi:", err.message);
    }
  }

  return { trackingNumber, labelUrl, order: updated };
}

/** Commandes payées, pas encore annoncées au transporteur, dont la période de drop est terminée. */
export async function findDueOrders() {
  const orders = await Order.find({ status: "paid" });
  return orders.filter((o) => !o.delivery?.trackingNumber && o.delivery?.methodId && !holdUntil(o));
}

export async function releaseDueOrders() {
  const due = await findDueOrders();
  const results = [];
  for (const order of due) {
    try {
      const r = await shipOrder(order);
      results.push({ id: order._id, ok: true, trackingNumber: r.trackingNumber });
    } catch (err) {
      results.push({ id: order._id, ok: false, error: err.message });
    }
  }
  return results;
}
