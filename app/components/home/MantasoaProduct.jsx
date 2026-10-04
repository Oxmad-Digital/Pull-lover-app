"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { selectFeaturedProduct } from "@/app/lib/featured-product.mjs";
import { useLang } from "@/app/i18n/I18nProvider";
import { localePath } from "@/app/i18n/config.mjs";
import { formatPrice } from "@/app/i18n/format.mjs";
import { localizeProduct } from "@/app/i18n/product.mjs";

const TEXT = {
  fr: {
    visualLabel: "Voir la fiche produit du cardigan",
    visualAlt: "Vue portée du cardigan, un pull écru à la maille généreuse",
    worn: "Vue portée",
    origin: "Maille de Madagascar",
    madeToOrder: "À la demande",
    collection: "Collection Mantasoa",
    fallbackName: "Le cardigan",
    priceNote: "Hors taxes · total calculé au panier",
    fallbackDescription: "Une maille essentielle, pensée pour vous accompagner longtemps. Chaque pièce prend forme dans notre atelier familial à Antananarivo.",
    loading: "Chargement du vêtement…",
    error: "Les disponibilités ne peuvent pas être chargées pour le moment.",
    empty: "Les réservations ne sont pas encore disponibles.",
    cta: "Voir le produit",
  },
  en: {
    visualLabel: "View the cardigan product page",
    visualAlt: "The cardigan worn, an ecru sweater with a generous knit",
    worn: "Worn view",
    origin: "Knitwear from Madagascar",
    madeToOrder: "Made to order",
    collection: "Mantasoa collection",
    fallbackName: "The cardigan",
    priceNote: "Excl. VAT · total calculated in your cart",
    fallbackDescription: "An essential knit, designed to stay with you for years. Each piece takes shape in our family workshop in Antananarivo.",
    loading: "Loading the garment…",
    error: "Availability can’t be loaded right now.",
    empty: "Reservations are not open yet.",
    cta: "View the product",
  },
};

// initialState : calculé au rendu serveur ; absent (base injoignable), le produit est chargé ici.
export default function MantasoaProduct({ initialState = null }) {
  const lang = useLang();
  const t = TEXT[lang];
  const money = (value) => formatPrice(value, lang);
  const [state, setState] = useState(initialState ?? { status: "loading", product: null });

  useEffect(() => {
    if (initialState) return undefined;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let active = true;
    fetch("/api/products?limit=20", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Product unavailable");
        const data = await response.json();
        if (!Array.isArray(data.products)) throw new Error("Invalid products");
        const product = selectFeaturedProduct(data.products);
        if (!active) return;
        setState({ status: product ? "ready" : "empty", product });
      })
      .catch(() => { if (active) setState({ status: "error", product: null }); })
      .finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [initialState]);

  const { status } = state;
  const product = localizeProduct(state.product, lang);
  const price = product ? Number(product.promoPrice ?? product.price) : null;
  const validPrice = price !== null && Number.isFinite(price) && price >= 0;

  return (
    <section className="pl-product" id="piece" aria-labelledby="product-title">
      <Link className="pl-product-visual" href={localePath(lang, "/products/mantasoa")} aria-label={t.visualLabel}>
        {/* Conteneur absolu : le lien devient sticky sur grand écran, position que next/image refuse pour `fill`. */}
        <span className="pl-product-media">
          <Image src="/api/media/pull-lover-manequin-cardigan-3.webp" alt={t.visualAlt} fill sizes="(max-width: 939px) 100vw, 65vw" />
        </span>
        <span className="pl-image-tag">{t.worn}</span>
      </Link>
      <div className="pl-product-info" aria-busy={status === "loading"}>
        <div className="pl-drop-row"><span>{t.origin}</span><span>{t.madeToOrder}</span></div>
        <p className="pl-eyebrow">{t.collection}</p>
        <h2 id="product-title">{product?.name || t.fallbackName}</h2>
        {validPrice && <p className="pl-price">{money(price)} {product.promoPrice != null && product.promoPrice < product.price && <del>{money(product.price)}</del>}<span>{t.priceNote}</span></p>}
        <p className="pl-product-description">{product?.description || t.fallbackDescription}</p>

        {status === "loading" && <div className="pl-product-state" role="status"><span className="pl-loading-line" />{t.loading}</div>}
        {status === "error" && <div className="pl-product-state" role="status"><p>{t.error}</p></div>}
        {status === "empty" && <div className="pl-product-state"><p>{t.empty}</p></div>}

        <Link className="pl-button pl-product-link" href={localePath(lang, "/products/mantasoa")}>{t.cta} <span aria-hidden="true">→</span></Link>
      </div>
    </section>
  );
}
