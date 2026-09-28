// app/lib/products.js
// Lectures produit partagées par les pages serveur et l'API publique.

import { cache } from "react";
import Product from "@/app/models/Product";
import Review from "@/app/models/Review";
import "@/app/models/Category";
import { isValidId } from "@/app/lib/db";
import { selectFeaturedProduct } from "@/app/lib/featured-product.mjs";

// Même forme que la réponse JSON de l'API (dates en chaînes), pour les composants client
const asJson = (value) => JSON.parse(JSON.stringify(value));

/**
 * Produit recherché par id, slug ou « mantasoa » (URL marketing du produit unique).
 * cache() : les métadonnées et la page d'un même rendu partagent une seule lecture.
 */
export const findProductByParam = cache(async (id) => {
  const query = id.toLowerCase() === "mantasoa"
    ? Product.findOne({})
    : isValidId(id)
      ? Product.findById(id)
      : Product.findOne({ slug: id });

  return query
    .populate({ path: "category", select: "name slug" })
    .lean();
});

/**
 * Tout ce qu'affiche /products/[id], lu en parallèle au rendu serveur
 * (mêmes requêtes que GET /api/reviews et GET /api/products?category=…&limit=4).
 * @returns {Promise<{ product: object, reviews: object[], relatedProducts: object[] } | null>}
 */
export async function getProductPageData(id) {
  const product = await findProductByParam(id);
  if (!product) return null;

  const categoryId = product.category?._id || product.category;
  const [reviews, related] = await Promise.all([
    Review.find({ productId: product._id }).sort({ date: -1 }).lean(),
    categoryId
      ? Product.find({ category: categoryId }).sort({ createdAt: -1 }).limit(4).lean()
      : [],
  ]);

  return asJson({
    product,
    reviews,
    relatedProducts: related.filter((item) => item._id !== product._id),
  });
}

/**
 * État initial de la fiche mise en avant, calculé au rendu serveur (même sélection que
 * GET /api/products?limit=20). null si la base est injoignable : le client charge alors lui-même.
 * @returns {Promise<{ status: "ready" | "empty", product: object | null } | null>}
 */
export async function getFeaturedProductState() {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 }).limit(20).lean();
    const populated = await Product.populate(products, { path: "category", select: "name" });
    const product = selectFeaturedProduct(populated);
    return { status: product ? "ready" : "empty", product: product ? asJson(product) : null };
  } catch (error) {
    console.error("Produit mis en avant indisponible au rendu serveur:", error.message);
    return null;
  }
}
