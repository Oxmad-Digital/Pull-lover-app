import { notFound, permanentRedirect } from "next/navigation";
import { getProductPageData } from "@/app/lib/products";
import JsonLd from "@/app/components/JsonLd";
import { breadcrumbJsonLd, productJsonLd, productPath } from "@/app/lib/seo";
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

  // Une seule URL par fiche. /products/<uuid> est déjà redirigé en 308 par le middleware ;
  // ceci rattrape les autres variantes (casse différente, « MANTASOA »…).
  const path = productPath(data.product);
  if (decodeURIComponent(id) !== path.slice("/products/".length)) permanentRedirect(path);

  return (
    <>
      <JsonLd
        data={[
          productJsonLd(data.product, { path, reviews: data.reviews }),
          breadcrumbJsonLd([["Accueil", "/"], [data.product.name, path]]),
        ]}
      />
      <ProductDetail
        product={data.product}
        initialReviews={data.reviews}
        relatedProducts={data.relatedProducts}
      />
    </>
  );
}
