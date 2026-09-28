import { ReactNode } from "react";
import { findProductByParam, getFeaturedProductState } from "@/app/lib/products";
import { FEATURED_PRODUCT_PATH, metaDescription, openGraphBase, pageAlternates, productPath } from "@/app/lib/seo";
import { localePath, toLocale } from "@/app/i18n/config.mjs";
import { localizeProduct } from "@/app/i18n/product.mjs";

export async function generateMetadata({ params }: { params: Promise<{ id: string; lang: string }> }) {
  const { id, lang: rawLang } = await params;
  const lang = toLocale(rawLang);
  try {
    // Lecture directe en base : plus d'appel HTTP vers notre propre API
    const [found, featured] = await Promise.all([findProductByParam(id), getFeaturedProductState()]);
    if (!found) return {};
    const product = localizeProduct(found, lang);
    const description = metaDescription(product.description);
    // Le produit mis en avant a une URL marketing : c'est elle qui doit être indexée
    const path = featured?.product?._id === String(product._id) ? FEATURED_PRODUCT_PATH : productPath(product);
    return {
      title: product.name,
      description,
      alternates: pageAlternates(lang, path),
      openGraph: {
        ...openGraphBase(lang),
        title: product.name,
        description,
        url: localePath(lang, path),
        images: product.image ? [{ url: product.image, alt: product.name }] : [],
      },
    };
  } catch {
    return {};
  }
}

export default function ProductLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
