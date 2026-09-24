// app/lib/cartWeight.js
// Poids d'expédition d'un panier, calculé côté serveur depuis les fiches produit (kg).

import Product from "@/app/models/Product";
import { isValidId } from "@/app/lib/db";
import { DEFAULT_ITEM_WEIGHT } from "@/app/lib/sendcloud";

/**
 * @param {Array<{ _id: string, quantity?: number }>} items
 * @returns {Promise<number>} poids total en kg (arrondi au gramme)
 */
export async function getCartWeight(items) {
  let total = 0;
  for (const item of items || []) {
    if (!isValidId(item?._id)) continue;
    const product = await Product.findById(item._id);
    const unit = Number(product?.weight) > 0 ? Number(product.weight) : DEFAULT_ITEM_WEIGHT;
    total += unit * (Number(item.quantity) || 1);
  }
  return Math.max(0.001, Math.round(total * 1000) / 1000);
}
