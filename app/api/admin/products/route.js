// app/api/admin/products/route.js
// CRUD des produits pour l'administration (la lecture publique est dans /api/products).
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Product from "@/app/models/Product";
import { requireAdmin } from "@/app/lib/auth";
import { escapeRegex } from "@/app/lib/text";
import { deleteFromR2 } from "@/app/lib/r2";
import { cleanProductTranslations } from "@/app/i18n/product.mjs";

// Champs modifiables via PATCH (bascule rapide depuis la liste admin)
const PATCHABLE_FIELDS = ["isAvailable"];

/** Normalise le corps JSON du formulaire produit (images déjà uploadées). */
function productFields(body) {
  const {
    name, brand, size, sizes, condition, description, details, careInstructions, fitInfo, shippingInfo, color,
    price, promoPrice, stock, stocks, weight,
    images, image, imageKeys, translations,
  } = body;

  return {
    name,
    brand: brand || "",
    size: size || "",
    sizes: sizes || [],
    condition: condition || "",
    description: description || "",
    details: details || "",
    careInstructions: careInstructions || "",
    fitInfo: fitInfo || "",
    shippingInfo: shippingInfo || "",
    color: color || "",
    price: Number(price) || 0,
    weight: Number(weight) > 0 ? Number(weight) : 0,
    promoPrice: promoPrice || null,
    stock: Number(stock) || 0,
    stocks: stocks || {},
    images: images || [],
    image: image || images?.[0] || "",
    imageKeys: imageKeys || [],
    translations: cleanProductTranslations(translations),
    isAvailable: Number(stock) > 0,
  };
}

async function deleteKeys(keys) {
  await Promise.all(
    keys.filter(Boolean).map((key) =>
      deleteFromR2(key).catch((err) =>
        console.error(`❌ Erreur suppression: ${key}`, err)
      )
    )
  );
}

export async function GET(request) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const filter   = searchParams.get("filter") || "all";
    const search   = searchParams.get("search");
    const sort     = searchParams.get("sort") || "createdAt";
    const order    = searchParams.get("order") || "desc";
    const isExport = searchParams.get("export") === "true";
    const page     = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit    = isExport
      ? 5000
      : Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));

    // Mode mono-produit : la fiche produit existe toujours, même à stock 0
    if ((await Product.countDocuments()) === 0) {
      await Product.create({
        name: "Cardigan en maille milano",
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
    if (search)           query.name = { $regex: escapeRegex(search), $options: "i" };

    const sortOptions = { [sort]: order === "asc" ? 1 : -1 };

    const [products, filteredTotal] = await Promise.all([
      Product.find(query)
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

export async function POST(request) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    await connectDB();

    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ message: "Nom du produit obligatoire" }, { status: 400 });
    }

    const product = await Product.create(productFields(body));
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("PRODUCT POST ERROR:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    await connectDB();

    const body = await request.json();
    if (!body._id) {
      return NextResponse.json({ message: "ID manquant" }, { status: 400 });
    }

    const previousProduct = await Product.findById(body._id);
    if (!previousProduct) {
      return NextResponse.json({ message: "Produit introuvable" }, { status: 404 });
    }

    const product = await Product.findByIdAndUpdate(body._id, productFields(body), { new: true });

    // Supprime de R2 les images retirées du produit
    const keptKeys = new Set(body.imageKeys || []);
    await deleteKeys((previousProduct.imageKeys || []).filter((key) => !keptKeys.has(key)));

    return NextResponse.json({ product });
  } catch (error) {
    console.error("PRODUCT PUT ERROR:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    await connectDB();

    const { productId, updates } = await request.json();

    if (!productId) {
      return NextResponse.json({ success: false, message: "ID produit manquant" }, { status: 400 });
    }

    const allowed = Object.fromEntries(
      Object.entries(updates || {}).filter(([key]) => PATCHABLE_FIELDS.includes(key))
    );
    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ success: false, message: "Aucun champ modifiable" }, { status: 400 });
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      { $set: allowed },
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
    const denied = await requireAdmin();
    if (denied) return denied;

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

    await deleteKeys(product.imageKeys || []);

    return NextResponse.json({ success: true, message: "Produit supprimé" });
  } catch (error) {
    console.error("PRODUCT DELETE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors de la suppression", error: error.message },
      { status: 500 }
    );
  }
}
