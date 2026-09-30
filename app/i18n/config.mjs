// app/i18n/config.mjs
// Langues du site. Le français est servi à la racine (/panier), l'anglais sous /en (/en/panier) :
// le proxy (proxy.js) réécrit en interne chaque URL publique vers app/[lang]/…
// Sans dépendance : importable depuis le proxy, le serveur, les composants client et les tests.

export const LOCALES = ["fr", "en"];
export const DEFAULT_LOCALE = "fr";

// Dernière langue consultée : lue par les routes API pour répondre (et écrire les e-mails) dans la bonne langue
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const isLocale = (value) => LOCALES.includes(value);

/**
 * Langue sûre à partir d'une valeur quelconque (paramètre de route, cookie, corps de requête).
 * @param {unknown} value
 * @returns {"fr" | "en"}
 */
export const toLocale = (value) => /** @type {"fr" | "en"} */ (isLocale(value) ? value : DEFAULT_LOCALE);

/** Locale Intl (dates, nombres) et Open Graph de chaque langue. */
export const INTL_LOCALE = { fr: "fr-FR", en: "en-GB" };
export const OG_LOCALE = { fr: "fr_FR", en: "en_GB" };

/**
 * URL publique d'un chemin dans une langue : localePath("en", "/panier") → "/en/panier",
 * localePath("en", "/") → "/en", localePath("en", "/#piece") → "/en#piece".
 */
export function localePath(lang, path = "/") {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (lang === DEFAULT_LOCALE || !isLocale(lang)) return clean;
  if (clean === "/") return `/${lang}`;
  if (clean.startsWith("/#") || clean.startsWith("/?")) return `/${lang}${clean.slice(1)}`;
  return `/${lang}${clean}`;
}

/**
 * Sépare la langue du reste du chemin : "/en/panier" → { lang: "en", path: "/panier", prefixed: true }.
 * Un chemin sans préfixe est en français.
 */
export function splitLocale(pathname = "/") {
  const [, first, ...rest] = pathname.split("/");
  if (isLocale(first)) return { lang: first, path: `/${rest.join("/")}`, prefixed: true };
  return { lang: DEFAULT_LOCALE, path: pathname || "/", prefixed: false };
}

/** Choisit le texte de la langue : tr("en", "Panier", "Cart") → "Cart". */
export const tr = (lang, fr, en) => (lang === "en" ? en : fr);
