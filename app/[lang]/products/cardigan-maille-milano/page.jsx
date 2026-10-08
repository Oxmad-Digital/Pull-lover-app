import MantasoaProductPage from "./MantasoaProductPage";
import JsonLd from "@/app/components/JsonLd";
import { getFeaturedProductState } from "@/app/lib/products";
import { FEATURED_PRODUCT_PATH, breadcrumbJsonLd, openGraphBase, pageAlternates, productJsonLd } from "@/app/lib/seo";
import { localePath } from "@/app/i18n/config.mjs";
import { localizeProduct } from "@/app/i18n/product.mjs";
import { FEATURED_PRODUCT_COPY } from "@/app/lib/featured-product-copy.mjs";
import { mediaUrl, productColors } from "@/app/lib/product-colors.mjs";
// Styles propres à cette fiche : chargés ici plutôt que dans le layout de toutes les pages
import "@/app/mantasoa-product.css";

// Fiche rendue côté serveur avec le stock du moment, régénérée au plus toutes les 60 s
export const revalidate = 60;

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

// Photo principale de la première couleur (partages et données structurées)
const heroImage = (product) => mediaUrl(productColors(product)[0].images[0]);

// Nom (version anglaise si renseignée) et photo saisis dans l'admin, valeurs par défaut si la base est injoignable
async function productMeta(lang) {
  const state = await getFeaturedProductState();
  return {
    name: localizeProduct(state?.product, lang)?.name || FEATURED_PRODUCT_COPY[lang].name,
    image: heroImage(state?.product),
  };
}

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const t = TEXT[lang];
  const { name, image } = await productMeta(lang);
  return {
    title: name,
    description: t.description,
    alternates: pageAlternates(lang, FEATURED_PRODUCT_PATH),
    openGraph: {
      ...openGraphBase(lang),
      title: `${name} — Pull-Lover`,
      description: t.ogDescription,
      url: localePath(lang, FEATURED_PRODUCT_PATH),
      images: [{ url: image, alt: t.ogAlt }],
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
            productJsonLd(product, { path, images: [heroImage(product)] }),
            breadcrumbJsonLd([[TEXT[lang].home, localePath(lang, "/")], [product.name, path]]),
          ]}
        />
      )}
      <MantasoaProductPage initialState={initialState} />
    </>
  );
}
