import MantasoaProductPage from "./MantasoaProductPage";
import JsonLd from "@/app/components/JsonLd";
import { getFeaturedProductState } from "@/app/lib/products";
import { FEATURED_PRODUCT_PATH, breadcrumbJsonLd, openGraphBase, pageAlternates, productJsonLd } from "@/app/lib/seo";
import { localePath } from "@/app/i18n/config.mjs";
import { localizeProduct } from "@/app/i18n/product.mjs";
import { FEATURED_PRODUCT_COPY } from "@/app/lib/featured-product-copy.mjs";
// Styles propres à cette fiche : chargés ici plutôt que dans le layout de toutes les pages
import "@/app/mantasoa-product.css";

// Fiche rendue côté serveur avec le stock du moment, régénérée au plus toutes les 60 s
export const revalidate = 60;

const HERO_IMAGE = "/api/media/products/cardigan-maille-milano/cardigan-vert-mannequin-broderie-v4.webp";

const TEXT = {
  fr: {
    description:
      "Découvrez notre cardigan en maille de Madagascar, choisissez votre taille et commandez cette pièce fabriquée à la demande dans notre atelier familial.",
    ogDescription: "Une maille essentielle, imaginée et fabriquée à Madagascar.",
    ogAlt: "Cardigan en maille vert brodé d'un cœur, porté en studio",
    home: "Accueil",
  },
  en: {
    description:
      "Discover our knit cardigan from Madagascar, choose your size and order this essential piece, made to order in our family workshop in Antananarivo.",
    ogDescription: "An essential knit, designed and made in Madagascar.",
    ogAlt: "Green knit cardigan with an embroidered heart, worn in the studio",
    home: "Home",
  },
};

// Nom saisi dans l'admin (version anglaise si renseignée), texte par défaut si la base est injoignable
async function productName(lang) {
  const state = await getFeaturedProductState();
  return localizeProduct(state?.product, lang)?.name || FEATURED_PRODUCT_COPY[lang].name;
}

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const t = TEXT[lang];
  const name = await productName(lang);
  return {
    title: name,
    description: t.description,
    alternates: pageAlternates(lang, FEATURED_PRODUCT_PATH),
    openGraph: {
      ...openGraphBase(lang),
      title: `${name} — Pull-Lover`,
      description: t.ogDescription,
      url: localePath(lang, FEATURED_PRODUCT_PATH),
      images: [{ url: HERO_IMAGE, width: 1254, height: 1254, alt: t.ogAlt }],
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
