export const runtime = "nodejs";

import { NextResponse }     from "next/server";
import { requireAdmin }     from "@/app/lib/auth";
import { connectDB }        from "@/app/lib/db";
import { SENDCLOUD_CONFIGURED } from "@/app/lib/sendcloud";
import { findDueOrders, releaseDueOrders } from "@/app/lib/shipOrder";

// GET : liste (sans rien envoyer) des commandes dont la période de drop est terminée
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  await connectDB();
  const due = await findDueOrders();
  return NextResponse.json({
    count: due.length,
    orders: due.map((o) => ({
      _id: o._id,
      orderNumber: o._id.toString().slice(-8).toUpperCase(),
      customer: `${o.customer?.firstname || ""} ${o.customer?.lastname || ""}`.trim(),
      carrier: o.delivery?.carrier,
    })),
  });
}

// POST { confirm: true } : annonce toutes les commandes échues au transporteur
export async function POST(req) {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!SENDCLOUD_CONFIGURED) return NextResponse.json({ message: "SendCloud non configuré" }, { status: 503 });
  const { confirm } = await req.json().catch(() => ({}));
  if (confirm !== true) return NextResponse.json({ message: "Confirmation requise" }, { status: 400 });
  await connectDB();
  const results = await releaseDueOrders();
  return NextResponse.json({ results });
}
