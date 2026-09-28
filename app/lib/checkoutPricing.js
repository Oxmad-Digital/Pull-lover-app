// app/lib/checkoutPricing.js
// Source de vérité serveur du montant d'une commande : le client n'envoie que
// des ids / quantités / code promo, jamais de prix.

import Promo from "@/app/models/Promo";
import { isValidId } from "@/app/lib/db";
import { getShippingOptions } from "@/app/lib/sendcloud";
import { getCartWeight, loadCartProducts } from "@/app/lib/cartWeight";
import { computeTotals, round2, TVA_RATE } from "@/app/lib/pricing.mjs";
import { tr } from "@/app/i18n/config.mjs";

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
 *   signalée dans `shortages` au lieu de bloquer l'enregistrement ; lang : langue des messages d'erreur
 *   renvoyés au client (les ruptures signalées à l'admin restent en français)
 * @returns {Promise<{ lines: Array, subtotal: number, discount: number, tva: number, shipping: number, total: number, promoCode: string|null }>}
 */
export async function computeOrderTotals({ cartItems, promoCode, delivery, allowStockShortage = false, lang = "fr" }) {
  const t = (fr, en) => tr(lang, fr, en);
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new CheckoutError(t("Panier vide", "Your cart is empty"));
  }

  const lines = [];
  let subtotal = 0;
  // Quantités cumulées par produit / par taille : un même produit peut apparaître
  // sur plusieurs lignes (couleurs différentes) et ne doit pas dépasser le stock au total.
  const qtyByProduct = new Map();
  const qtyBySize = new Map();
  const shortages = [];
  const shortage = (fr, en) => {
    if (!allowStockShortage) throw new CheckoutError(t(fr, en));
    shortages.push(fr);
  };
  // Une seule lecture pour tout le panier, réutilisée pour le calcul du poids
  const productsById = await loadCartProducts(cartItems);
  for (const item of cartItems) {
    if (!isValidId(item?._id)) throw new CheckoutError(t("ID produit invalide", "Invalid product ID"));
    const quantity = Math.floor(Number(item.quantity));
    if (!(quantity >= 1 && quantity <= 99)) throw new CheckoutError(t("Quantité invalide", "Invalid quantity"));

    const size = typeof item.size === "string" ? item.size : "";
    const color = typeof item.color === "string" ? item.color : "";

    const product = productsById.get(item._id.toLowerCase());
    if (!product) throw new CheckoutError(t(`Produit indisponible : ${item._id}`, `Product unavailable: ${item._id}`));
    const displayName = (lang === "en" && product.translations?.en?.name) || product.name;
    if (product.isAvailable === false) shortage(`Produit indisponible : ${product.name}`, `Product unavailable: ${displayName}`);

    const productQty = (qtyByProduct.get(item._id) || 0) + quantity;
    qtyByProduct.set(item._id, productQty);
    const sizeKey = `${item._id}:${size}`;
    const sizeQty = (qtyBySize.get(sizeKey) || 0) + quantity;
    qtyBySize.set(sizeKey, sizeQty);

    const sizeStock = size ? product.stocks?.[size] : undefined;
    if (sizeStock !== undefined && Number(sizeStock) < sizeQty) {
      shortage(`Stock insuffisant : ${product.name} (${size})`, `Not enough stock: ${displayName} (${size})`);
    } else if (Number(product.stock) < productQty) {
      shortage(`Stock insuffisant : ${product.name}`, `Not enough stock: ${displayName}`);
    }

    const unitPrice = Number(product.promoPrice ?? product.price);
    if (!(unitPrice > 0)) throw new CheckoutError(t(`Prix invalide pour ${product.name}`, `Invalid price for ${displayName}`));

    subtotal += unitPrice * quantity;
    lines.push({
      product: String(product._id),
      name: product.name,
      // Nom anglais figé avec la commande : e-mails envoyés dans la langue du client
      nameEn: product.translations?.en?.name || "",
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
    if (!promo || !promo.isActive) throw new CheckoutError(t("Code promo invalide ou inactif", "Invalid or inactive promo code"));
    if (promo.expiresAt && new Date() > promo.expiresAt) throw new CheckoutError(t("Code promo expiré", "Promo code expired"));
    if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) throw new CheckoutError(t("Code promo épuisé", "Promo code no longer available"));
    if (promo.minOrderAmount > 0 && subtotal < promo.minOrderAmount) {
      throw new CheckoutError(t(`Montant minimum requis : ${promo.minOrderAmount} €`, `Minimum order required: €${promo.minOrderAmount}`));
    }
    appliedCode = promo.code;
  }

  // Livraison : tarif réel Sendcloud du service choisi (tranche de poids du panier, pays de destination)
  const countryCode = String(delivery?.countryCode || "FR").toUpperCase();
  let weight;
  let shippingMethod;
  try {
    weight = await getCartWeight(cartItems, productsById);
    const options = await getShippingOptions({ toCountry: countryCode, weight });
    shippingMethod = options.find((o) => o.key === delivery?.optionKey);
  } catch (err) {
    console.error("SENDCLOUD METHODS ERROR:", err);
    throw new CheckoutError(t("Modes d'expédition indisponibles", "Shipping methods unavailable"), 502);
  }
  if (!shippingMethod) throw new CheckoutError(t("Mode d'expédition invalide", "Invalid shipping method"));
  if (!(shippingMethod.price >= 0) || shippingMethod.price == null) {
    throw new CheckoutError(t("Tarif d'expédition indisponible pour ce mode de livraison", "No shipping rate available for this delivery method"), 502);
  }
  if (shippingMethod.servicePoint && !delivery?.servicePoint?.id) {
    throw new CheckoutError(t("Veuillez choisir un point relais", "Please choose a pickup point"));
  }
  const shipping = round2(shippingMethod.price);

  const { discount, tva, total } = computeTotals({ subtotal, promo, shipping });

  return { lines, subtotal, discount, tva, shipping, total, promoCode: appliedCode, shippingMethod, weight, countryCode, shortages };
}
