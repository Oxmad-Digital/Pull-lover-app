// app/lib/pricing.mjs
// Calcul du total partagé entre le panier, le checkout et le serveur : le montant
// affiché au client est ainsi toujours celui qui sera débité.

export const TVA_RATE = 0.2;
export const round2 = (n) => Math.round(n * 100) / 100;

/** Remise d'un code promo ({ type, value }) sur un sous-total, recalculée à chaque changement du panier. */
export function promoDiscount(promo, subtotal) {
  if (!promo) return 0;
  const value = Number(promo.value) || 0;
  const discount = promo.type === "percentage" ? (subtotal * value) / 100 : Math.min(value, subtotal);
  return round2(Math.max(0, discount));
}

export function computeTotals({ subtotal, promo, shipping = 0 }) {
  const discount = promoDiscount(promo, subtotal);
  const discounted = round2(Math.max(0, subtotal - discount));
  const tva = round2(discounted * TVA_RATE);
  const total = round2(discounted + tva + (Number(shipping) || 0));
  return { discount, discounted, tva, total };
}

/** Le code promo n'est appliqué que si le panier atteint son montant minimum. */
export function applicablePromo(promo, subtotal) {
  if (!promo?.type) return null;
  return subtotal >= (Number(promo.minOrderAmount) || 0) ? promo : null;
}

export const formatEuro = (n) =>
  Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });

export const PROMO_STORAGE_KEY = "pull-lover-promo";
const PROMO_TTL_MS = 24 * 60 * 60 * 1000;

/** Code promo mémorisé entre le panier et le checkout (null si absent, expiré ou ancien format). */
export function readStoredPromo() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PROMO_STORAGE_KEY) || "null");
    if (!parsed?.code || !parsed.type || Date.now() - (parsed.savedAt || 0) > PROMO_TTL_MS) {
      localStorage.removeItem(PROMO_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
