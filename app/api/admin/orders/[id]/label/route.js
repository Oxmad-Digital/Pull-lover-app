// app/api/admin/orders/[id]/label/route.js
export const runtime = "nodejs";

import { NextResponse }      from "next/server";
import { getServerSession }  from "next-auth";
import { authOptions }       from "@/app/api/auth/[...nextauth]/route";
import { connectDB, isValidId } from "@/app/lib/db";
import Order                 from "@/app/models/Order";
import { SENDCLOUD_CONFIGURED } from "@/app/lib/sendcloud";
import { shipOrder, ShipError } from "@/app/lib/shipOrder";

// POST { force?: boolean } — force = expédier avant la fin de la période de drop
export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Accès refusé" }, { status: 401 });
    }

    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ message: "ID invalide" }, { status: 400 });
    }

    if (!SENDCLOUD_CONFIGURED) {
      return NextResponse.json(
        { message: "API SendCloud non configurée. Renseignez SENDCLOUD_PUBLIC_KEY et SENDCLOUD_SECRET_KEY dans .env" },
        { status: 503 }
      );
    }

    const { force } = await req.json().catch(() => ({}));

    await connectDB();
    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ message: "Commande introuvable" }, { status: 404 });
    }

    const { trackingNumber, labelUrl, order: updated } = await shipOrder(order, { force: force === true });
    return NextResponse.json({ success: true, trackingNumber, labelUrl, order: updated });
  } catch (error) {
    if (error instanceof ShipError) {
      return NextResponse.json(
        { message: error.message, trackingNumber: error.trackingNumber, releaseAt: error.releaseAt },
        { status: error.status }
      );
    }
    console.error("LABEL GENERATION ERROR:", error);
    if (error.message === "SENDCLOUD_NON_CONFIGURE") {
      return NextResponse.json({ message: "Clés API SendCloud manquantes dans .env" }, { status: 503 });
    }
    return NextResponse.json({ message: error.message || "Erreur serveur" }, { status: 500 });
  }
}
