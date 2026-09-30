import MantasoaProductPage from "./MantasoaProductPage";
import JsonLd from "@/app/components/JsonLd";
import { getFeaturedProductState } from "@/app/lib/products";
import { FEATURED_PRODUCT_PATH, breadcrumbJsonLd, openGraphBase, pageAlternates, productJsonLd } from "@/app/lib/seo";
import { localePath } from "@/app/i18n/config.mjs";
import { localizeProduct } from "@/app/i18n/product.mjs";

// Fiche rendue côté serveur avec le stock du moment, régénérée au plus toutes les 60 s
export const revalidate = 60;

const HERO_IMAGE = "/api/media/site/mantasoa-hero.webp";

const TEXT = {
  fr: {
    title: "Cardigan en maille de Madagascar",
    description:
      "Découvrez notre cardigan en maille de Madagascar, choisissez votre taille et commandez cette pièce fabriquée à la demande dans notre atelier familial.",
    ogTitle: "Cardigan en maille de Madagascar — Pull-Lover",
    ogDescription: "Une maille essentielle, imaginée et fabriquée à Madagascar.",
    ogAlt: "Cardigan en maille porté au bord du lac",
    home: "Accueil",
  },
  en: {
    title: "Knit cardigan from Madagascar",
    description:
      "Discover our knit cardigan from Madagascar, choose your size and order this essential piece, made to order in our family workshop in Antananarivo.",
    ogTitle: "Knit cardigan from Madagascar — Pull-Lover",
    ogDescription: "An essential knit, designed and made in Madagascar.",
    ogAlt: "Knit cardigan worn by the lake",
    home: "Home",
  },
};

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const t = TEXT[lang];
  return {
    title: t.title,
    description: t.description,
    alternates: pageAlternates(lang, FEATURED_PRODUCT_PATH),
    openGraph: {
      ...openGraphBase(lang),
      title: t.ogTitle,
      description: t.ogDescription,
      url: localePath(lang, FEATURED_PRODUCT_PATH),
      images: [{ url: HERO_IMAGE, width: 1586, height: 992, alt: t.ogAlt }],
    },
  };
}

export default async function MantasoaPage({ params }) {
  const { lang } = await params;
  const initialState = await getFeaturedProductState();
  const product = localizeProduct(initialState?.product, lang);
  const path = localePath(lang, FEATURED_PRODUCT_PATH);
  return (
    <>
      {product && (
        <JsonLd
          data={[
            productJsonLd(product, { path, images: [HERO_IMAGE] }),
            breadcrumbJsonLd([[TEXT[lang].home, localePath(lang, "/")], [product.name, path]]),
          ]}
        />
      )}
      <MantasoaProductPage initialState={initialState} />
    </>
  );
}
