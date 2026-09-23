"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { selectMantasoa } from "@/app/lib/featured-product.mjs";

const money = (value) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(value);

export default function MantasoaProduct() {
  const [state, setState] = useState({ status: "loading", product: null });

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let active = true;
    fetch("/api/products?search=Mantasoa&limit=20", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Product unavailable");
        const data = await response.json();
        if (!Array.isArray(data.products)) throw new Error("Invalid products");
        const product = selectMantasoa(data.products);
        if (!active) return;
        setState({ status: product ? "ready" : "empty", product });
      })
      .catch(() => { if (active) setState({ status: "error", product: null }); })
      .finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, []);

  const { product, status } = state;
  const price = product ? Number(product.promoPrice ?? product.price) : null;
  const validPrice = price !== null && Number.isFinite(price) && price >= 0;

  return (
    <section className="pl-product" id="piece" aria-labelledby="product-title">
      <Link className="pl-product-visual" href="/products/mantasoa" aria-label="Voir la fiche produit du Mantasoa">
        <Image src="/api/media/site/mantasoa-hero.webp" alt="Vue portée du Mantasoa, un pull écru à la maille généreuse" fill sizes="(max-width: 939px) 100vw, 65vw" />
        <span className="pl-image-tag">Le Mantasoa · Vue portée</span>
      </Link>
      <div className="pl-product-info" aria-busy={status === "loading"}>
        <div className="pl-drop-row"><span>Maille de Madagascar</span><span>À la demande</span></div>
        <p className="pl-eyebrow">Notre première pièce</p>
        <h2 id="product-title">{product?.name || "Le Mantasoa"}</h2>
        {validPrice && <p className="pl-price">{money(price)} {product.promoPrice != null && product.promoPrice < product.price && <del>{money(product.price)}</del>}<span>Hors taxes · total calculé au panier</span></p>}
        <p className="pl-product-description">{product?.description || "Une maille essentielle, pensée pour vous accompagner longtemps. Chaque pièce prend forme dans notre atelier familial à Antananarivo."}</p>

        {status === "loading" && <div className="pl-product-state" role="status"><span className="pl-loading-line" />Chargement du vêtement…</div>}
        {status === "error" && <div className="pl-product-state" role="status"><p>Les disponibilités ne peuvent pas être chargées pour le moment.</p></div>}
        {status === "empty" && <div className="pl-product-state"><p>Les réservations du Mantasoa ne sont pas encore disponibles.</p></div>}

        <Link className="pl-button pl-product-link" href="/products/mantasoa">Voir le produit <span aria-hidden="true">→</span></Link>
      </div>
    </section>
  );
}
