// app/api/products/[id]/route.js

import { NextResponse } from "next/server";
import { findProductByParam } from "@/app/lib/products";

export async function GET(req, { params }) {
  try {
    // ✅ Next.js 16 : params doit être await
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID manquant" },
        { status: 400 }
      );
    }

    const product = await findProductByParam(id);

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Produit non trouvé" },
        { status: 404 }
      );
    }

    // Cache-Control posé par next.config.ts (/api/products(.*))
    return NextResponse.json({ success: true, product });

  } catch (error) {
    console.error("❌ ERREUR:", error.message);
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
