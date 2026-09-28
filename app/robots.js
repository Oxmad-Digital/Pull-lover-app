import { SITE_URL } from "./lib/seo";
import { LOCALES, localePath } from "./i18n/config.mjs";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Pages privées, dans chaque langue (/panier et /en/panier…)
      disallow: [
        "/api/",
        "/admin",
        ...LOCALES.flatMap((lang) =>
          ["/dashboard", "/auth/", "/panier", "/checkout", "/success", "/verify-email"].map((path) => localePath(lang, path))
        ),
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
