import { NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/app/lib/db";
import { computeOrderTotals, CheckoutError } from "@/app/lib/checkoutPricing";

// Le montant est recalculé côté serveur à partir du panier : le client n'envoie jamais de prix.
export async function POST(req) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  try {
    const { cartItems, promoCode, customerEmail, delivery } = await req.json();

    await connectDB();
    const { total } = await computeOrderTotals({ cartItems, promoCode, delivery });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // en centimes
      currency: "eur",
      receipt_email: customerEmail || undefined,
      automatic_payment_methods: { enabled: true },
      metadata: { source: "pull-lover-checkout", promoCode: promoCode || "" },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret, total });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error("❌ PaymentIntent error:", error);
    return NextResponse.json({ message: "Erreur lors de la création du paiement" }, { status: 500 });
  }
}
