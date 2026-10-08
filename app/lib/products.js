// app/lib/products.js
// Lectures produit partagées par les pages serveur et l'API publique.

import { cache } from "react";
import Product from "@/app/models/Product";
import Review from "@/app/models/Review";
import { isValidId } from "@/app/lib/db";
import { selectFeaturedProduct } from "@/app/lib/featured-product.mjs";

// Même forme que la réponse JSON de l'API (dates en chaînes), pour les composants client
const asJson = (value) => JSON.parse(JSON.stringify(value));

/**
 * Avis affichables : les avis malformés (anciens enregistrements non validés) sont écartés
 * et seuls les champs publics sont renvoyés (jamais l'identifiant du compte auteur).
 */
export function publicReviews(reviews) {
  return (reviews || [])
    .filter((review) =>
      typeof review?.name === "string" &&
      typeof review.comment === "string" &&
      Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5
    )
    .map(({ _id, productId, name, rating, comment, date }) => ({ _id, productId, name, rating, comment, date }));
}

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

  return query.lean();
});

/**
 * Tout ce qu'affiche /products/[id], lu en parallèle au rendu serveur
 * (même requête que GET /api/reviews).
 * @returns {Promise<{ product: object, reviews: object[] } | null>}
 */
export async function getProductPageData(id) {
  const product = await findProductByParam(id);
  if (!product) return null;

  const reviews = await Review.find({ productId: product._id }).sort({ date: -1 }).lean();

  return asJson({
    product,
    reviews: publicReviews(reviews),
  });
}

/**
 * État initial de la fiche mise en avant, calculé au rendu serveur (même sélection que
 * GET /api/products?limit=20). null si la base est injoignable : le client charge alors lui-même.
 * @returns {Promise<{ status: "ready" | "empty", product: object | null } | null>}
 */
export const getFeaturedProductState = cache(async () => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 }).limit(20).lean();
    const product = selectFeaturedProduct(products);
    return { status: product ? "ready" : "empty", product: product ? asJson(product) : null };
  } catch (error) {
    console.error("Produit mis en avant indisponible au rendu serveur:", error.message);
    return null;
  }
});
