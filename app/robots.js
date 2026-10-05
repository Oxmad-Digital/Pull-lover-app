import { SITE_URL } from "./lib/seo";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Les pages de compte, panier et tunnel d'achat ne sont pas bloquées ici : elles portent un
      // noindex que Google doit pouvoir lire (bloquées, elles resteraient indexables sans contenu).
      disallow: ["/api/", "/admin"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
