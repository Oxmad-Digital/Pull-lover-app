export const runtime = "nodejs";

import { NextResponse }     from "next/server";
import { getServerSession } from "next-auth";
import { authOptions }      from "@/app/api/auth/[...nextauth]/route";
import { connectDB }        from "@/app/lib/db";
import { SENDCLOUD_CONFIGURED } from "@/app/lib/sendcloud";
import { findDueOrders, releaseDueOrders } from "@/app/lib/shipOrder";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "admin";
}

// GET : liste (sans rien envoyer) des commandes dont la période de drop est terminée
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ message: "Accès refusé" }, { status: 401 });
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
  if (!(await requireAdmin())) return NextResponse.json({ message: "Accès refusé" }, { status: 401 });
  if (!SENDCLOUD_CONFIGURED) return NextResponse.json({ message: "SendCloud non configuré" }, { status: 503 });
  const { confirm } = await req.json().catch(() => ({}));
  if (confirm !== true) return NextResponse.json({ message: "Confirmation requise" }, { status: 400 });
  await connectDB();
  const results = await releaseDueOrders();
  return NextResponse.json({ results });
}
