export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import { getShippingOptions, SENDCLOUD_CONFIGURED } from "@/app/lib/sendcloud";
import { getCartWeight } from "@/app/lib/cartWeight";
import { translator } from "@/app/i18n/server";

// POST /api/shipping-methods  { country: "FR", items: [{ _id, quantity }] }
// Le poids est calculé côté serveur : le client ne choisit que le transporteur / service.
export async function POST(req) {
  const t = translator(req);
  const { country = "FR", items = [] } = await req.json().catch(() => ({}));
  const countryCode = String(country).toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    return NextResponse.json({ message: t("Pays invalide", "Invalid country") }, { status: 400 });
  }
  if (!SENDCLOUD_CONFIGURED) {
    return NextResponse.json({ message: t("SendCloud non configuré", "Shipping is not configured") }, { status: 503 });
  }

  try {
    await connectDB();
    const weight = await getCartWeight(items);
    const options = await getShippingOptions({ toCountry: countryCode, weight });
    return NextResponse.json({
      options,
      publicKey: process.env.SENDCLOUD_PUBLIC_KEY, // clé publique, requise par le widget points relais
    });
  } catch (error) {
    console.error("SHIPPING METHODS ERROR:", error);
    return NextResponse.json({ message: t("Modes d'expédition indisponibles", "Shipping methods unavailable") }, { status: 502 });
  }
}
