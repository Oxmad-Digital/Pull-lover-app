// app/i18n/product.mjs
// Textes produit traduits : saisis dans l'admin sous product.translations.en.<champ>.
// Un champ anglais vide retombe sur le texte français.

export const TRANSLATABLE_PRODUCT_FIELDS = [
  "name",
  "description",
  "details",
  "careInstructions",
  "fitInfo",
  "shippingInfo",
  "color",
];

export function localizeProduct(product, lang) {
  if (!product || lang === "fr") return product;
  const translated = product.translations?.[lang];
  if (!translated) return product;
  const localized = { ...product };
  for (const field of TRANSLATABLE_PRODUCT_FIELDS) {
    const value = translated[field];
    if (typeof value === "string" && value.trim()) localized[field] = value;
  }
  return localized;
}

/** Ne garde que les champs traduisibles, sous forme de chaînes (corps de formulaire admin). */
export function cleanProductTranslations(input) {
  const en = input?.en || {};
  return {
    en: Object.fromEntries(
      TRANSLATABLE_PRODUCT_FIELDS.map((field) => [field, typeof en[field] === "string" ? en[field].trim() : ""])
    ),
  };
}
