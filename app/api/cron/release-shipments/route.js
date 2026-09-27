export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB }    from "@/app/lib/db";
import { SENDCLOUD_CONFIGURED } from "@/app/lib/sendcloud";
import { releaseDueOrders } from "@/app/lib/shipOrder";

// Appelé par un cron (ex. Vercel Cron) avec `Authorization: Bearer $CRON_SECRET`.
// Désactivé tant que CRON_SECRET n'est pas défini. N'est PAS enregistré dans vercel.json.
export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "Accès refusé" }, { status: 401 });
  }
  if (!SENDCLOUD_CONFIGURED) return NextResponse.json({ message: "SendCloud non configuré" }, { status: 503 });
  await connectDB();
  return NextResponse.json({ results: await releaseDueOrders() });
}
