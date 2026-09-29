import { NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/app/lib/db";
import Order from "@/app/models/Order";
import { sendEmail, adminEmail } from "@/app/lib/mailer";
import { getPaymentAlertEmailTemplate } from "@/app/lib/emailTemplates";

export async function POST(req) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("❌ Webhook signature invalide:", err.message);
    return NextResponse.json({ message: "Webhook Error" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    console.log("✅ Paiement confirmé via webhook:", paymentIntent.id);

    // Filet de sécurité : le client a payé mais la commande n'a pas été enregistrée
    // (onglet fermé, erreur réseau après confirmation Stripe…). On laisse 60 s au checkout
    // pour créer la commande avant d'alerter ; Stripe relance le webhook en cas de 5xx.
    if (paymentIntent.metadata?.source === "pull-lover-checkout") {
      try {
        await connectDB();
        const order = await Order.findOne({ stripePaymentId: paymentIntent.id });
        const ageSec = Date.now() / 1000 - paymentIntent.created;
        if (!order) {
          if (ageSec < 60) return NextResponse.json({ message: "Commande pas encore créée" }, { status: 503 });
          await sendEmail({
            to: adminEmail(),
            subject: `⚠️ Paiement Stripe sans commande — ${paymentIntent.id}`,
            html: getPaymentAlertEmailTemplate({
              amount: paymentIntent.amount_received / 100,
              customerEmail: paymentIntent.receipt_email,
              paymentIntentId: paymentIntent.id,
            }),
          });
        }
      } catch (err) {
        console.error("❌ Vérification commande/webhook:", err.message);
        return NextResponse.json({ message: "Erreur interne" }, { status: 500 });
      }
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;
    console.error("❌ Paiement échoué:", paymentIntent.id, paymentIntent.last_payment_error?.message);
  }

  return NextResponse.json({ received: true });
}
