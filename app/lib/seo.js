// app/lib/seo.js
// Constantes et helpers SEO partagés (métadonnées, URLs, données structurées).
// Sans dépendance serveur : importable depuis les composants client.

export const SITE_URL = "https://www.pull-lover.com";
export const SITE_NAME = "Pull-Lover";

// Next.js remplace l'objet openGraph du parent au lieu de le fusionner :
// chaque page qui définit openGraph repart de cette base.
export const OPEN_GRAPH_BASE = { siteName: SITE_NAME, locale: "fr_FR", type: "website" };

// Pages de compte, panier, tunnel d'achat… : ni indexées ni suivies
export const NO_INDEX = { index: false, follow: false };

// URL marketing du produit mis en avant (mode mono-produit)
export const FEATURED_PRODUCT_PATH = "/products/mantasoa";

/** URL publique d'une fiche produit : le slug, à défaut l'id. */
export const productPath = (product) => `/products/${product.slug || product._id}`;

export const absoluteUrl = (path) => new URL(path, SITE_URL).toString();

/** Description d'au plus `max` caractères, coupée sur un espace plutôt qu'au milieu d'un mot. */
export function metaDescription(text, max = 155) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.–—-]+$/, "")}…`;
}

export const organizationJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: absoluteUrl("/pull-lover_logo_coeur_rouge-transparent.webp"),
  description: "Mailles artisanales fabriquées à la demande dans notre atelier familial à Antananarivo, Madagascar.",
});

export const websiteJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: "fr-FR",
  publisher: { "@id": `${SITE_URL}/#organization` },
});

export const breadcrumbJsonLd = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, path], index) => ({
    "@type": "ListItem",
    position: index + 1,
    name,
    item: absoluteUrl(path),
  })),
});

/**
 * Fiche Product schema.org. La note moyenne n'est ajoutée que si les avis
 * sont affichés sur la page (exigence Google).
 */
export function productJsonLd(product, { path, images = [], reviews = [] } = {}) {
  const url = absoluteUrl(path || productPath(product));
  const inStock = product.isAvailable !== false && Number(product.stock || 0) > 0;
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: metaDescription(product.description, 5000) || undefined,
    image: [...new Set([product.image, ...(product.images || []), ...images].filter(Boolean))].map(absoluteUrl),
    sku: String(product._id),
    brand: { "@type": "Brand", name: SITE_NAME },
    color: product.color || undefined,
    url,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "EUR",
      price: Number(product.promoPrice ?? product.price ?? 0).toFixed(2),
      availability: inStock ? "https://schema.org/PreOrder" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": `${SITE_URL}/#organization` },
    },
  };

  const rated = reviews.filter((review) => Number(review.rating) > 0);
  if (rated.length) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: (rated.reduce((sum, review) => sum + Number(review.rating), 0) / rated.length).toFixed(1),
      reviewCount: rated.length,
      bestRating: 5,
      worstRating: 1,
    };
    data.review = rated.slice(0, 10).map((review) => ({
      "@type": "Review",
      author: { "@type": "Person", name: review.name },
      datePublished: review.date ? String(review.date).slice(0, 10) : undefined,
      reviewBody: review.comment,
      reviewRating: { "@type": "Rating", ratingValue: Number(review.rating), bestRating: 5, worstRating: 1 },
    }));
  }
  return data;
}
