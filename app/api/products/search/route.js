import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Product from "@/app/models/Product";

export async function GET(req) {
  try {
    // Connexion PostgreSQL (Neon)
    await connectDB();

    // Récupération du mot-clé ?q=
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    // Si aucune recherche
    if (!q || q.trim() === "") {
      return NextResponse.json([]);
    }

    // Recherche insensible à la casse
    const products = await Product.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { brand: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ],
    }).limit(20);

    return NextResponse.json(products);
  } catch (error) {
    console.error("❌ ERREUR SEARCH:", error);
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
