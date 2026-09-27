// app/lib/checkoutPricing.js
// Source de vérité serveur du montant d'une commande : le client n'envoie que
// des ids / quantités / code promo, jamais de prix.

import Product from "@/app/models/Product";
import Promo from "@/app/models/Promo";
import { isValidId } from "@/app/lib/db";
import { getShippingOptions } from "@/app/lib/sendcloud";
import { getCartWeight } from "@/app/lib/cartWeight";

export const TVA_RATE = 0.2;
export const round2 = (n) => Math.round(n * 100) / 100;

export class CheckoutError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * @param {{ cartItems: Array<{_id: string, quantity?: number, size?: string, color?: string}>, promoCode?: string|null }} params
 * @returns {Promise<{ lines: Array, subtotal: number, discount: number, tva: number, shipping: number, total: number, promoCode: string|null }>}
 */
export async function computeOrderTotals({ cartItems, promoCode, delivery }) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new CheckoutError("Panier vide");
  }

  const lines = [];
  let subtotal = 0;
  for (const item of cartItems) {
    if (!isValidId(item?._id)) throw new CheckoutError("ID produit invalide");
    const quantity = Math.floor(Number(item.quantity));
    if (!(quantity >= 1 && quantity <= 99)) throw new CheckoutError("Quantité invalide");

    const product = await Product.findById(item._id);
    if (!product || product.isAvailable === false) {
      throw new CheckoutError(`Produit indisponible : ${item.name || item._id}`);
    }

    const sizeStock = item.size ? product.stocks?.[item.size] : undefined;
    if (sizeStock !== undefined && Number(sizeStock) < quantity) {
      throw new CheckoutError(`Stock insuffisant : ${product.name} (${item.size})`);
    }
    if (Number(product.stock) < quantity) {
      throw new CheckoutError(`Stock insuffisant : ${product.name}`);
    }

    const unitPrice = Number(product.promoPrice ?? product.price);
    if (!(unitPrice > 0)) throw new CheckoutError(`Prix invalide pour ${product.name}`);

    subtotal += unitPrice * quantity;
    lines.push({
      product: String(product._id),
      name: product.name,
      image: product.image || "",
      size: item.size || "",
      color: item.color || "",
      quantity,
      unitPrice,
    });
  }

  let discount = 0;
  let appliedCode = null;
  if (promoCode) {
    const promo = await Promo.findOne({ code: String(promoCode).toUpperCase().trim() });
    if (!promo || !promo.isActive) throw new CheckoutError("Code promo invalide ou inactif");
    if (promo.expiresAt && new Date() > promo.expiresAt) throw new CheckoutError("Code promo expiré");
    if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) throw new CheckoutError("Code promo épuisé");
    if (promo.minOrderAmount > 0 && subtotal < promo.minOrderAmount) {
      throw new CheckoutError(`Montant minimum requis : ${promo.minOrderAmount} €`);
    }
    discount =
      promo.type === "percentage"
        ? Math.round((subtotal * promo.value) / 100)
        : Math.min(promo.value, subtotal);
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

  const discounted = Math.max(0, subtotal - discount);
  const tva = Math.round(discounted * TVA_RATE);
  const total = round2(discounted + tva + shipping);

  return { lines, subtotal, discount, tva, shipping, total, promoCode: appliedCode, shippingMethod, weight, countryCode };
}
