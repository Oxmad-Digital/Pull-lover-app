// app/lib/checkoutPricing.js
// Source de vérité serveur du montant d'une commande : le client n'envoie que
// des ids / quantités / code promo, jamais de prix.

import Product from "@/app/models/Product";
import Promo from "@/app/models/Promo";
import { isValidId } from "@/app/lib/db";
import { getShippingOptions } from "@/app/lib/sendcloud";
import { getCartWeight } from "@/app/lib/cartWeight";
import { computeTotals, round2, TVA_RATE } from "@/app/lib/pricing.mjs";

export { round2, TVA_RATE };

export class CheckoutError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * @param {{ cartItems: Array<{_id: string, quantity?: number, size?: string, color?: string}>, promoCode?: string|null,
 *   allowStockShortage?: boolean }} params  allowStockShortage : commande déjà payée, la rupture est
 *   signalée dans `shortages` au lieu de bloquer l'enregistrement
 * @returns {Promise<{ lines: Array, subtotal: number, discount: number, tva: number, shipping: number, total: number, promoCode: string|null }>}
 */
export async function computeOrderTotals({ cartItems, promoCode, delivery, allowStockShortage = false }) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new CheckoutError("Panier vide");
  }

  const lines = [];
  let subtotal = 0;
  // Quantités cumulées par produit / par taille : un même produit peut apparaître
  // sur plusieurs lignes (couleurs différentes) et ne doit pas dépasser le stock au total.
  const qtyByProduct = new Map();
  const qtyBySize = new Map();
  const shortages = [];
  const shortage = (message) => {
    if (!allowStockShortage) throw new CheckoutError(message);
    shortages.push(message);
  };
  for (const item of cartItems) {
    if (!isValidId(item?._id)) throw new CheckoutError("ID produit invalide");
    const quantity = Math.floor(Number(item.quantity));
    if (!(quantity >= 1 && quantity <= 99)) throw new CheckoutError("Quantité invalide");

    const size = typeof item.size === "string" ? item.size : "";
    const color = typeof item.color === "string" ? item.color : "";

    const product = await Product.findById(item._id);
    if (!product) throw new CheckoutError(`Produit indisponible : ${item._id}`);
    if (product.isAvailable === false) shortage(`Produit indisponible : ${product.name}`);

    const productQty = (qtyByProduct.get(item._id) || 0) + quantity;
    qtyByProduct.set(item._id, productQty);
    const sizeKey = `${item._id}:${size}`;
    const sizeQty = (qtyBySize.get(sizeKey) || 0) + quantity;
    qtyBySize.set(sizeKey, sizeQty);

    const sizeStock = size ? product.stocks?.[size] : undefined;
    if (sizeStock !== undefined && Number(sizeStock) < sizeQty) {
      shortage(`Stock insuffisant : ${product.name} (${size})`);
    } else if (Number(product.stock) < productQty) {
      shortage(`Stock insuffisant : ${product.name}`);
    }

    const unitPrice = Number(product.promoPrice ?? product.price);
    if (!(unitPrice > 0)) throw new CheckoutError(`Prix invalide pour ${product.name}`);

    subtotal += unitPrice * quantity;
    lines.push({
      product: String(product._id),
      name: product.name,
      image: product.image || "",
      size,
      color,
      quantity,
      unitPrice,
    });
  }

  subtotal = round2(subtotal);
  let promo = null;
  let appliedCode = null;
  if (promoCode) {
    promo = await Promo.findOne({ code: String(promoCode).toUpperCase().trim() });
    if (!promo || !promo.isActive) throw new CheckoutError("Code promo invalide ou inactif");
    if (promo.expiresAt && new Date() > promo.expiresAt) throw new CheckoutError("Code promo expiré");
    if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) throw new CheckoutError("Code promo épuisé");
    if (promo.minOrderAmount > 0 && subtotal < promo.minOrderAmount) {
      throw new CheckoutError(`Montant minimum requis : ${promo.minOrderAmount} €`);
    }
    appliedCode = promo.code;
  }

  // Livraison : tarif réel Sendcloud du service choisi (tranche de poids du panier, pays de destination)
  const countryCode = String(delivery?.countryCode || "FR").toUpperCase();
  let weight;
  let shippingMethod;
  try {
    weight = await getCartWeight(cartItems);
    const options = await getShippingOptions({ toCountry: countryCode, weight });
    shippingMethod = options.find((o) => o.key === delivery?.optionKey);
  } catch (err) {
    console.error("SENDCLOUD METHODS ERROR:", err);
    throw new CheckoutError("Modes d'expédition indisponibles", 502);
  }
  if (!shippingMethod) throw new CheckoutError("Mode d'expédition invalide");
  if (!(shippingMethod.price >= 0) || shippingMethod.price == null) {
    throw new CheckoutError("Tarif d'expédition indisponible pour ce mode de livraison", 502);
  }
  if (shippingMethod.servicePoint && !delivery?.servicePoint?.id) {
    throw new CheckoutError("Veuillez choisir un point relais");
  }
  const shipping = round2(shippingMethod.price);

  const { discount, tva, total } = computeTotals({ subtotal, promo, shipping });

  return { lines, subtotal, discount, tva, shipping, total, promoCode: appliedCode, shippingMethod, weight, countryCode, shortages };
}
