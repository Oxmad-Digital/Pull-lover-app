import { ReactNode } from "react";
import { findProductByParam, getFeaturedProductState } from "@/app/lib/products";
import { FEATURED_PRODUCT_PATH, OPEN_GRAPH_BASE, metaDescription, productPath } from "@/app/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // Lecture directe en base : plus d'appel HTTP vers notre propre API
    const [product, featured] = await Promise.all([findProductByParam(id), getFeaturedProductState()]);
    if (!product) return {};
    const description = metaDescription(product.description);
    // Le produit mis en avant a une URL marketing : c'est elle qui doit être indexée
    const canonical = featured?.product?._id === String(product._id) ? FEATURED_PRODUCT_PATH : productPath(product);
    return {
      title: product.name,
      description,
      alternates: { canonical },
      openGraph: {
        ...OPEN_GRAPH_BASE,
        title: product.name,
        description,
        url: canonical,
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
