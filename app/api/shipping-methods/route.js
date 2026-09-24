export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import { getShippingOptions, SENDCLOUD_CONFIGURED } from "@/app/lib/sendcloud";
import { getCartWeight } from "@/app/lib/cartWeight";

// POST /api/shipping-methods  { country: "FR", items: [{ _id, quantity }] }
// Le poids est calculé côté serveur : le client ne choisit que le transporteur / service.
export async function POST(req) {
  const { country = "FR", items = [] } = await req.json().catch(() => ({}));
  const countryCode = String(country).toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    return NextResponse.json({ message: "Pays invalide" }, { status: 400 });
  }
  if (!SENDCLOUD_CONFIGURED) {
    return NextResponse.json({ message: "SendCloud non configuré" }, { status: 503 });
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
    return NextResponse.json({ message: "Modes d'expédition indisponibles" }, { status: 502 });
  }
}
