// app/i18n/server.js
// Langue d'une requête API : les routes ne sont pas préfixées par /en, la langue vient donc
// du cookie posé par le proxy à chaque page visitée (ou d'un champ explicite du corps).

import { LOCALE_COOKIE, toLocale, tr } from "./config.mjs";

export function requestLang(req, explicit) {
  if (explicit) return toLocale(explicit);
  return toLocale(req?.cookies?.get?.(LOCALE_COOKIE)?.value);
}

/** Raccourci pour les messages d'API : const t = translator(req); t("Panier vide", "Your cart is empty"). */
export function translator(req, explicit) {
  const lang = requestLang(req, explicit);
  const t = (fr, en) => tr(lang, fr, en);
  t.lang = lang;
  return t;
}
