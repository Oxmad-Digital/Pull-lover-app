export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Product from "@/app/models/Product";
import "@/app/models/Category";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const filter   = searchParams.get("filter") || "all";
    const search   = searchParams.get("search");
    const sort     = searchParams.get("sort") || "createdAt";
    const order    = searchParams.get("order") || "desc";
    const category = searchParams.get("category");
    const isExport = searchParams.get("export") === "true";
    const page     = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit    = isExport
      ? 5000
      : Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));

    // Mode mono-produit : la fiche Mantasoa existe toujours, même à stock 0
    if ((await Product.countDocuments()) === 0) {
      await Product.create({
        name: "Le Mantasoa",
        price: 0,
        stock: 0,
        stocks: {},
        sizes: [],
        isAvailable: false,
      });
    }

    let query = {};

    if (filter === "out") query.stock = 0;
    if (filter === "low") query.stock = { $gt: 0, $lt: 5 };
    if (search)           query.name = { $regex: search, $options: "i" };
    if (category)         query.category = category;

    const sortOptions = { [sort]: order === "asc" ? 1 : -1 };

    const [products, filteredTotal] = await Promise.all([
      Product.find(query)
        .populate("category", "name")
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    const [total, outOfStock, lowStock] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ stock: 0 }),
      Product.countDocuments({ stock: { $gt: 0, $lt: 5 } }),
    ]);

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        total: filteredTotal,
        page,
        limit,
        pages: Math.ceil(filteredTotal / limit),
      },
      stats: { total, outOfStock, lowStock },
    });
  } catch (error) {
    console.error("PRODUCTS GET ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Erreur", error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });
    }

    await connectDB();

    const { productId, updates } = await request.json();

    if (!productId) {
      return NextResponse.json({ success: false, message: "ID produit manquant" }, { status: 400 });
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!product) {
      return NextResponse.json({ success: false, message: "Produit non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Produit mis à jour", product });
  } catch (error) {
    console.error("PRODUCT PATCH ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors de la mise à jour", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("id");

    if (!productId) {
      return NextResponse.json({ success: false, message: "ID produit manquant" }, { status: 400 });
    }

    const product = await Product.findByIdAndDelete(productId);

    if (!product) {
      return NextResponse.json({ success: false, message: "Produit non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Produit supprimé" });
  } catch (error) {
    console.error("PRODUCT DELETE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors de la suppression", error: error.message },
      { status: 500 }
    );
  }
}
