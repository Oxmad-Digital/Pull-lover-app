// app/api/products/route.js
export const runtime = "nodejs";
export const revalidate = 60;

import "@/app/models/Category";

import { connectDB } from "@/app/lib/db";
import Product from "@/app/models/Product";
import { NextResponse } from "next/server";
import { deleteFromR2 } from "@/app/lib/r2";

/* =======================
   GET
======================= */
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 5;
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category");

    const skip = (page - 1) * limit;
    const filter = {};

    if (search) filter.name = { $regex: search, $options: "i" };
    if (category && category !== "") {
      filter.category = category;
    }

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
    const products = await Product.populate(result.data, {
      path: "category",
      select: "name",
      options: { strictPopulate: false },
    });

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
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

/* =======================
   Supprimer de R2
======================= */
async function deleteKeys(keys) {
  await Promise.all(
    keys.filter(Boolean).map((key) =>
      deleteFromR2(key).catch((err) =>
        console.error(`❌ Erreur suppression: ${key}`, err)
      )
    )
  );
}

/* =======================
   POST - Ajouter produit
   ✅ Reçoit du JSON (images déjà uploadées)
======================= */
export async function POST(req) {
  try {
    await connectDB();
    console.log("🟢 POST produit - DB connectée");

    // ✅ JSON au lieu de FormData
    const body = await req.json();
    console.log("🟢 Body reçu:", { name: body.name, images: body.images?.length });

    const {
      name, brand, size, sizes, condition, description, details, careInstructions,
      price, promoPrice, stock, stocks, category,
      images, image, imageKeys,
    } = body;

    if (!name) {
      return NextResponse.json(
        { message: "Nom du produit obligatoire" },
        { status: 400 }
      );
    }

    const product = await Product.create({
      name,
      brand: brand || "",
      size: size || "",
      sizes: sizes || [],
      condition: condition || "",
      description: description || "",
      details: details || "",
      careInstructions: careInstructions || "",
      price: Number(price) || 0,
      promoPrice: promoPrice || null,
      stock: Number(stock) || 0,
      stocks: stocks || {},
      category: category && category !== "null" && category !== ""
        ? category
        : undefined,
      images: images || [],
      image: image || images?.[0] || "",
      imageKeys: imageKeys || [],
      isAvailable: Number(stock) > 0,
    });

    console.log(`✅ Produit créé: ${product.name}`);
    return NextResponse.json(product, { status: 201 });

  } catch (error) {
    console.error("❌ ERREUR POST:", error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

/* =======================
   PUT - Modifier produit
   ✅ Reçoit du JSON (images déjà uploadées)
======================= */
export async function PUT(req) {
  try {
    await connectDB();

    // ✅ JSON au lieu de FormData
    const body = await req.json();
    const {
      _id, name, brand, size, sizes, condition, description, details, careInstructions,
      price, promoPrice, stock, stocks, category,
      images, image, imageKeys,
    } = body;

    if (!_id) {
      return NextResponse.json({ message: "ID manquant" }, { status: 400 });
    }

    const previousProduct = await Product.findById(_id);
    if (!previousProduct) {
      return NextResponse.json({ message: "Produit introuvable" }, { status: 404 });
    }

    const updateData = {
      name,
      brand: brand || "",
      size: size || "",
      sizes: sizes || [],
      condition: condition || "",
      description: description || "",
      details: details || "",
      careInstructions: careInstructions || "",
      price: Number(price) || 0,
      promoPrice: promoPrice || null,
      stock: Number(stock) || 0,
      stocks: stocks || {},
      category: category && category !== "null" && category !== ""
        ? category
        : undefined,
      images: images || [],
      image: image || images?.[0] || "",
      imageKeys: imageKeys || [],
      isAvailable: Number(stock) > 0,
    };

    const product = await Product.findByIdAndUpdate(_id, updateData, { new: true });

    const keptKeys = new Set(imageKeys || []);
    await deleteKeys((previousProduct.imageKeys || []).filter((key) => !keptKeys.has(key)));

    console.log(`✅ Produit modifié: ${product.name}`);
    return NextResponse.json({ product });

  } catch (error) {
    console.error("❌ ERREUR PUT:", error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

/* =======================
   DELETE
======================= */
export async function DELETE(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "ID manquant" }, { status: 400 });
    }

    const product = await Product.findById(id);
    if (product?.imageKeys?.length > 0) {
      await deleteKeys(product.imageKeys);
    }

    await Product.findByIdAndDelete(id);
    console.log(`🗑️ Produit supprimé: ${id}`);
    return NextResponse.json({ message: "Produit supprimé", success: true });

  } catch (error) {
    console.error("❌ ERREUR DELETE:", error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
