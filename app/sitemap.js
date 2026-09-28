import Product from "./models/Product";
import { FEATURED_PRODUCT_PATH, SITE_URL, productPath } from "./lib/seo";
import { selectFeaturedProduct } from "./lib/featured-product.mjs";
import { LOCALES, localePath } from "./i18n/config.mjs";

// Régénéré au plus toutes les heures : les nouvelles fiches y apparaissent sans redéploiement
export const revalidate = 3600;

const STATIC_PAGES = [
  ["/", 1, "weekly"],
  [FEATURED_PRODUCT_PATH, 0.9, "weekly"],
  ["/contact", 0.6, "monthly"],
  ["/conditions-de-vente", 0.2, "yearly"],
  ["/mentions-legales", 0.1, "yearly"],
  ["/politique-de-confidentialite", 0.1, "yearly"],
];

/** Une entrée par langue, chacune listant ses traductions (hreflang). */
function localizedEntries(path, fields) {
  const languages = Object.fromEntries(LOCALES.map((lang) => [lang, `${SITE_URL}${localePath(lang, path)}`]));
  return LOCALES.map((lang) => ({
    url: languages[lang],
    alternates: { languages },
    ...fields,
  }));
}

export default async function sitemap() {
  const pages = STATIC_PAGES.flatMap(([path, priority, changeFrequency]) =>
    localizedEntries(path, { changeFrequency, priority })
  );

  try {
    const products = await Product.find({}).sort({ createdAt: -1 }).lean();
    // Le produit mis en avant est déjà présent via son URL marketing
    const featured = selectFeaturedProduct(products);
    for (const product of products) {
      if (product._id === featured?._id) continue;
      pages.push(...localizedEntries(productPath(product), {
        lastModified: product.updatedAt || product.createdAt,
        changeFrequency: "weekly",
        priority: 0.8,
      }));
    }
  } catch (error) {
    console.error("Sitemap : produits indisponibles:", error.message);
  }

  return pages;
}
