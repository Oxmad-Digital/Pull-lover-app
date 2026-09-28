// app/lib/cartWeight.js
// Poids d'expédition d'un panier, calculé côté serveur depuis les fiches produit (kg).

import Product from "@/app/models/Product";
import { isValidId } from "@/app/lib/db";
import { DEFAULT_ITEM_WEIGHT } from "@/app/lib/sendcloud";

/** Fiches produit du panier, lues en une seule requête, indexées par id. */
export async function loadCartProducts(items) {
  const ids = [...new Set((items || []).map((item) => item?._id).filter(isValidId))];
  if (!ids.length) return new Map();
  const products = await Product.find({ _id: { $in: ids } });
  return new Map(products.map((product) => [String(product._id).toLowerCase(), product]));
}

/**
 * @param {Array<{ _id: string, quantity?: number }>} items
 * @param {Map<string, object>} [productsById]  fiches déjà chargées (loadCartProducts)
 * @returns {Promise<number>} poids total en kg (arrondi au gramme)
 */
export async function getCartWeight(items, productsById) {
  const products = productsById || await loadCartProducts(items);
  let total = 0;
  for (const item of items || []) {
    if (!isValidId(item?._id)) continue;
    const product = products.get(item._id.toLowerCase());
    const unit = Number(product?.weight) > 0 ? Number(product.weight) : DEFAULT_ITEM_WEIGHT;
    total += unit * (Number(item.quantity) || 1);
  }
  return Math.max(0.001, Math.round(total * 1000) / 1000);
}
