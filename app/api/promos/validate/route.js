import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Promo from "@/app/models/Promo";
import { promoDiscount } from "@/app/lib/pricing.mjs";

export async function POST(req) {
  const { code, orderAmount } = await req.json();
  if (typeof code !== "string" || !code.trim()) return NextResponse.json({ error: "Code requis" }, { status: 400 });

  await connectDB();
  const promo = await Promo.findOne({ code: code.toUpperCase().trim() });

  if (!promo || !promo.isActive) {
    return NextResponse.json({ error: "Code promo invalide ou inactif" }, { status: 404 });
  }
  if (promo.expiresAt && new Date() > promo.expiresAt) {
    return NextResponse.json({ error: "Code promo expiré" }, { status: 400 });
  }
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
    return NextResponse.json({ error: "Code promo épuisé" }, { status: 400 });
  }
  const amount = Number(orderAmount) || 0;
  if (promo.minOrderAmount > 0 && amount < promo.minOrderAmount) {
    return NextResponse.json(
      { error: `Montant minimum requis : ${promo.minOrderAmount} €` },
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
