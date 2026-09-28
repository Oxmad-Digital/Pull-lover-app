import { ReactNode } from "react";
import { findProductByParam } from "@/app/lib/products";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // Lecture directe en base : plus d'appel HTTP vers notre propre API
    const product = await findProductByParam(id);
    if (!product) return {};
    return {
      title: product.name,
      description: product.description?.slice(0, 155) || "",
      openGraph: {
        title: product.name,
        description: product.description?.slice(0, 155) || "",
        images: product.image ? [{ url: product.image, width: 800, height: 800, alt: product.name }] : [],
        type: "website",
      },
    };
  } catch {
    return {};
  }
}

export default function ProductLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
