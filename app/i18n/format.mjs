// app/i18n/format.mjs
// Formatage des prix et des dates selon la langue affichée.

import { INTL_LOCALE, toLocale } from "./config.mjs";

const intl = (lang) => INTL_LOCALE[toLocale(lang)];

/** Montant en euros avec symbole : "120,00 €" en français, "€120.00" en anglais. */
export function formatPrice(value, lang = "fr") {
  return new Intl.NumberFormat(intl(lang), { style: "currency", currency: "EUR" }).format(Number(value || 0));
}

/** Comme formatPrice, sans décimales pour un montant rond (panier, paiement) : "120 €" / "€120", "12,50 €" / "€12.50". */
export function formatMoney(value, lang = "fr") {
  const amount = Number(value || 0);
  return new Intl.NumberFormat(intl(lang), {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(value, lang = "fr", options = { day: "numeric", month: "long", year: "numeric" }) {
  return new Intl.DateTimeFormat(intl(lang), options).format(new Date(value));
}

/** Nom d'un pays dans la langue affichée (FR → « France » / "France", DE → « Allemagne » / "Germany"). */
export function countryName(code, lang = "fr") {
  try {
    return new Intl.DisplayNames([intl(lang)], { type: "region" }).of(code) || code;
  } catch {
    return code;
  }
}
