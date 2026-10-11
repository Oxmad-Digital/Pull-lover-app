import { NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/app/lib/db";
import Settings from "@/app/models/Settings";
import { computeOrderTotals, CheckoutError } from "@/app/lib/checkoutPricing";
import { translator } from "@/app/i18n/server";
import { clientIp, rateLimit } from "@/app/lib/rateLimit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Le montant est recalculé côté serveur à partir du panier : le client n'envoie jamais de prix.
export async function POST(req) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const t = translator(req);
  try {
    // Un PaymentIntent par tentative de paiement : au-delà, c'est du test de cartes volées (card testing)
    const { allowed } = await rateLimit(`payment-intent:${clientIp(req)}`, { limit: 10, windowMs: 15 * 60 * 1000 });
    if (!allowed) {
      return NextResponse.json({ message: t("Trop de tentatives. Réessayez plus tard.", "Too many attempts. Please try again later.") }, { status: 429 });
    }

    const { cartItems, promoCode, customerEmail: rawEmail, delivery } = await req.json();
    const customerEmail = typeof rawEmail === "string" && EMAIL_PATTERN.test(rawEmail.trim()) ? rawEmail.trim() : "";

    await connectDB();
    // Commandes fermées depuis l'admin : aucun paiement n'est créé, quel que soit l'écran d'où vient l'appel
    const settings = await Settings.findOne();
    if (settings?.ordersOpen === false) {
      return NextResponse.json({ message: t("Les commandes ne sont pas encore ouvertes. Elles ouvriront très bientôt, merci de votre patience.", "Orders are not open yet. They will open very soon, thank you for your patience.") }, { status: 403 });
    }
    const { total } = await computeOrderTotals({ cartItems, promoCode, delivery, lang: t.lang });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // en centimes
      currency: "eur",
      receipt_email: customerEmail || undefined,
      automatic_payment_methods: { enabled: true },
      metadata: { source: "pull-lover-checkout", promoCode: typeof promoCode === "string" ? promoCode.slice(0, 50) : "" },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret, total });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error("❌ PaymentIntent error:", error);
    return NextResponse.json({ message: t("Erreur lors de la création du paiement", "Something went wrong while creating the payment") }, { status: 500 });
  }
}
