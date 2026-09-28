"use client";

import { createContext, useCallback, useContext } from "react";
import { DEFAULT_LOCALE, localePath } from "./config.mjs";

const LangContext = createContext(DEFAULT_LOCALE);

export function I18nProvider({ lang, children }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

/** Langue de la page courante ("fr" | "en"). */
export const useLang = () => useContext(LangContext);

/** Construit les liens internes dans la langue courante : href("/panier") → "/en/panier". */
export function useLocalePath() {
  const lang = useLang();
  return useCallback((path) => localePath(lang, path), [lang]);
}
