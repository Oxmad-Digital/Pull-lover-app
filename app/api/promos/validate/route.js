import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Promo from "@/app/models/Promo";
import { promoDiscount } from "@/app/lib/pricing.mjs";
import { translator } from "@/app/i18n/server";

export async function POST(req) {
  const t = translator(req);
  const { code, orderAmount } = await req.json();
  if (typeof code !== "string" || !code.trim()) return NextResponse.json({ error: t("Code requis", "Code required") }, { status: 400 });

  await connectDB();
  const promo = await Promo.findOne({ code: code.toUpperCase().trim() });

  if (!promo || !promo.isActive) {
    return NextResponse.json({ error: t("Code promo invalide ou inactif", "Invalid or inactive promo code") }, { status: 404 });
  }
  if (promo.expiresAt && new Date() > promo.expiresAt) {
    return NextResponse.json({ error: t("Code promo expiré", "Promo code expired") }, { status: 400 });
  }
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
    return NextResponse.json({ error: t("Code promo épuisé", "Promo code no longer available") }, { status: 400 });
  }
  const amount = Number(orderAmount) || 0;
  if (promo.minOrderAmount > 0 && amount < promo.minOrderAmount) {
    return NextResponse.json(
      { error: t(`Montant minimum requis : ${promo.minOrderAmount} €`, `Minimum order required: €${promo.minOrderAmount}`) },
      { status: 400 }
    );
  }

  const discount = promoDiscount(promo, amount);

  return NextResponse.json({
    code: promo.code,
    type: promo.type,
    value: promo.value,
    discount,
    description: promo.description,
    minOrderAmount: promo.minOrderAmount || 0,
  });
}
