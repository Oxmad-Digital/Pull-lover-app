// app/lib/analytics.mjs
// Mesure d'audience maison (remplace Google Analytics) : règles communes au suivi (/api/track)
// et à la page admin /admin/stats. Sans dépendance : importable depuis les tests.

import { splitLocale } from "../i18n/config.mjs";

// Pages publiques suivies (sans préfixe de langue). Connexion, espace client et admin ne le sont pas.
const TRACKED_PATHS = [
  "/",
  "/panier",
  "/checkout",
  "/success",
  "/contact",
  "/products/mantasoa",
  "/conditions-de-vente",
  "/mentions-legales",
  "/politique-de-confidentialite",
  "/suppression-donnees",
];
const PRODUCT_PATH = /^\/products\/[A-Za-z0-9%._~-]{1,200}$/;

/**
 * Chemin à enregistrer pour une URL vue, ou null s'il n'est pas suivi (admin, 404, valeur forgée).
 * La langue est conservée (/en/panier) pour distinguer l'audience anglophone.
 */
export function trackedPath(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.length > 300) return null;
  const pathname = value.length > 1 ? value.replace(/\/+$/, "") : value;
  const { path } = splitLocale(pathname);
  return TRACKED_PATHS.includes(path) || PRODUCT_PATH.test(path) ? pathname : null;
}

/** Domaine d'origine d'une visite (« www.google.com »), vide pour un accès direct ou interne. */
export function referrerHost(referrer, host) {
  if (typeof referrer !== "string" || !referrer) return "";
  try {
    const { host: refHost, protocol } = new URL(referrer);
    if (!/^https?:$/.test(protocol) && protocol !== "android-app:") return "";
    return refHost && refHost !== host ? refHost.slice(0, 120).toLowerCase() : "";
  } catch {
    return "";
  }
}

const countryNames =
  typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames(["fr"], { type: "region" }) : null;

/** Nom français d'un pays à partir de son code ISO (« MG » → « Madagascar »). */
export function countryLabel(code) {
  try {
    return countryNames?.of(code) ?? code;
  } catch {
    return code;
  }
}

export const DEVICE_LABELS = {
  desktop: "Ordinateur",
  mobile: "Mobile",
  tablet: "Tablette",
  console: "Console",
  smarttv: "TV connectée",
  wearable: "Montre connectée",
  embedded: "Autre",
};

/** Durée lisible : 61 000 ms → « 1 min 01 », 42 000 ms → « 42 s ». */
export function formatDuration(ms) {
  if (ms == null || !Number.isFinite(ms)) return "—";
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes} min ${String(seconds).padStart(2, "0")}` : `${seconds} s`;
}
