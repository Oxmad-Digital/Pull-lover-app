import { notFound } from "next/navigation";
import { getProductPageData } from "@/app/lib/products";
import ProductDetail from "./ProductDetail";
import "./product-detail.css";

// Fiche, avis et produits similaires rendus côté serveur, régénérés au plus toutes les 60 s
export const revalidate = 60;

// Aucune fiche pré-générée au build : chacune est rendue à la première visite puis mise en cache
export async function generateStaticParams() {
  return [];
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  const data = await getProductPageData(id);

  if (!data) notFound();

  return (
    <ProductDetail
      product={data.product}
      initialReviews={data.reviews}
      relatedProducts={data.relatedProducts}
    />
  );
}
