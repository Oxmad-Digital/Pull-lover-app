import MantasoaProductPage from "./MantasoaProductPage";
import JsonLd from "@/app/components/JsonLd";
import { getFeaturedProductState } from "@/app/lib/products";
import { FEATURED_PRODUCT_PATH, OPEN_GRAPH_BASE, breadcrumbJsonLd, productJsonLd } from "@/app/lib/seo";

// Fiche rendue côté serveur avec le stock du moment, régénérée au plus toutes les 60 s
export const revalidate = 60;

const HERO_IMAGE = "/api/media/site/mantasoa-hero.webp";

export const metadata = {
  title: "Cardigan en maille de Madagascar",
  description:
    "Découvrez notre cardigan en maille de Madagascar, choisissez votre taille et commandez cette pièce essentielle fabriquée à la demande dans notre atelier familial à Antananarivo.",
  alternates: { canonical: FEATURED_PRODUCT_PATH },
  openGraph: {
    ...OPEN_GRAPH_BASE,
    title: "Cardigan en maille de Madagascar — Pull-Lover",
    description: "Une maille essentielle, imaginée et fabriquée à Madagascar.",
    url: FEATURED_PRODUCT_PATH,
    images: [
      { url: HERO_IMAGE, width: 1586, height: 992, alt: "Cardigan en maille porté au bord du lac" },
    ],
  },
};

export default async function MantasoaPage() {
  const initialState = await getFeaturedProductState();
  const product = initialState?.product;
  return (
    <>
      {product && (
        <JsonLd
          data={[
            productJsonLd(product, { path: FEATURED_PRODUCT_PATH, images: [HERO_IMAGE] }),
            breadcrumbJsonLd([["Accueil", "/"], [product.name, FEATURED_PRODUCT_PATH]]),
          ]}
        />
      )}
      <MantasoaProductPage initialState={initialState} />
    </>
  );
}
