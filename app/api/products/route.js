// app/api/products/route.js
// Lecture publique du catalogue (le CRUD admin est dans /api/admin/products).
export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // dépend de la query ; cache géré par Cache-Control


import { connectDB } from "@/app/lib/db";
import Product from "@/app/models/Product";
import { NextResponse } from "next/server";
import { escapeRegex } from "@/app/lib/text";

/* =======================
   GET
======================= */
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    // Bornés : une requête publique ne doit pas pouvoir demander tout le catalogue d'un coup
    const page = Math.max(1, Math.floor(Number(searchParams.get("page"))) || 1);
    const limit = Math.min(50, Math.max(1, Math.floor(Number(searchParams.get("limit"))) || 5));
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;
    const filter = {};

    if (search) filter.name = { $regex: escapeRegex(search), $options: "i" };

    const [result] = await Product.aggregate([
      { $match: filter },
      {
        $facet: {
          data: [{ $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: limit }],
          total: [{ $count: "count" }],
        },
      },
    ]);

    const total = result.total[0]?.count ?? 0;
    const products = result.data;

    return NextResponse.json(
      {
        products,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );

  } catch (error) {
    console.error("❌ ERREUR GET:", error.message);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
