"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/app/components/CartContext";
import { productSizes, remainingStock, selectMantasoa } from "@/app/lib/featured-product.mjs";

const FALLBACK_IMAGES = [
  { src: "/api/media/site/mantasoa-hero.webp", alt: "Le Mantasoa écru porté au bord du lac" },
  { src: "/api/media/site/mantasoa-studio.png", alt: "Le pull Mantasoa écru vu de face" },
  { src: "/api/media/site/mantasoa-detail.png", alt: "Détail de la maille et du col du Mantasoa" },
];

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];

function formatPrice(value) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency", currency: "EUR", maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function normalizeImages(product) {
  const remoteImages = [product?.image, ...(product?.images || [])].filter(Boolean);
  const seen = new Set();
  return [
    ...remoteImages.map((src, index) => ({ src, alt: `${product?.name || "Le Mantasoa"} — vue ${index + 1}` })),
    ...FALLBACK_IMAGES,
  ].filter((image) => {
    if (seen.has(image.src)) return false;
    seen.add(image.src);
    return true;
  });
}

export default function MantasoaProductPage() {
  const router = useRouter();
  const { addToCart, cartItems } = useCart();
  const [status, setStatus] = useState("loading");
  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [confirmation, setConfirmation] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    fetch("/api/products?search=Mantasoa&limit=20", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Produit indisponible");
        const data = await response.json();
        const match = selectMantasoa(data.products || []);
        setProduct(match);
        setStatus(match ? "ready" : "empty");
      })
      .catch(() => setStatus("error"))
      .finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); controller.abort(); };
  }, []);

  const images = useMemo(() => normalizeImages(product), [product]);
  const sizes = useMemo(() => {
    const variants = product ? productSizes(product) : [];
    return [...variants].sort((a, b) => {
      const ai = SIZE_ORDER.indexOf(a);
      const bi = SIZE_ORDER.indexOf(b);
      if (ai === -1 || bi === -1) return String(a).localeCompare(String(b));
      return ai - bi;
    });
  }, [product]);
  const stockForSize = selectedSize && product ? remainingStock(product, selectedSize, cartItems) : 0;
  const purchasable = status === "ready" && product?.isAvailable !== false && Number(product.stock) > 0;
  const price = product ? Number(product.promoPrice ?? product.price) : null;


  function validateSelection() {
    if (!selectedSize) {
      setSizeError(true);
      document.getElementById("mantasoa-sizes")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    if (stockForSize < 1) return false;
    setSizeError(false);
    return true;
  }

  function addSelection() {
    if (!validateSelection()) return false;
    const requestedQuantity = Math.min(quantity, stockForSize);
    for (let index = 0; index < requestedQuantity; index += 1) {
      addToCart({
        _id: product._id, name: product.name, price: product.price,
        promoPrice: product.promoPrice || null,
        image: product.image || images[0].src,
        quantity: 1, size: selectedSize, color: "Écru naturel", stock: product.stock,
      });
    }
    setConfirmation(true);
    window.setTimeout(() => setConfirmation(false), 2600);
    return true;
  }

  function buyNow() {
    if (addSelection()) router.push("/checkout");
  }

  return (
    <article className="mp-page">
      <nav className="mp-breadcrumb" aria-label="Fil d’Ariane">
        <Link href="/">Accueil</Link><span>/</span><span>Le Mantasoa</span>
      </nav>

      <section className="mp-buy" aria-labelledby="mantasoa-title">
        <div className="mp-gallery">
          <div className="mp-thumbnails" aria-label="Vues du produit">
            {images.map((image, index) => (
              <button type="button" key={image.src} className={activeImage === index ? "is-active" : ""}
                onClick={() => setActiveImage(index)} aria-label={`Afficher la vue ${index + 1}`} aria-pressed={activeImage === index}>
                <Image src={image.src} alt="" fill sizes="84px" />
              </button>
            ))}
          </div>
          <div className="mp-main-image">
            <Image src={images[activeImage].src} alt={images[activeImage].alt} fill priority={activeImage === 0} sizes="(max-width: 900px) 100vw, 56vw" />
            <span className="mp-image-count">{activeImage + 1} / {images.length}</span>
            {images.length > 1 && <div className="mp-image-arrows">
              <button type="button" aria-label="Photo précédente" onClick={() => setActiveImage((activeImage - 1 + images.length) % images.length)}>←</button>
              <button type="button" aria-label="Photo suivante" onClick={() => setActiveImage((activeImage + 1) % images.length)}>→</button>
            </div>}
          </div>
        </div>

        <div className="mp-panel">
          <p className="mp-kicker">Maille de Madagascar · Pièce n° 01</p>
          <div className="mp-heading-row">
            <h1 id="mantasoa-title">{product?.name || "Le Mantasoa"}</h1>
            <span className="mp-made"><i aria-hidden="true" />Fabriqué à la demande</span>
          </div>
          <div className="mp-price-row">
            {price !== null ? <p className="mp-price">{formatPrice(price)}
              {product?.promoPrice != null && Number(product.promoPrice) < Number(product.price) && <del>{formatPrice(product.price)}</del>}
            </p> : <span className="mp-price-placeholder" />}
            <span>Hors taxes · total au panier</span>
          </div>
          <p className="mp-lead">{product?.description || "Une maille essentielle à la coupe droite et généreuse, pensée pour vous accompagner longtemps. Tricotée et finie avec soin dans notre atelier familial à Antananarivo."}</p>

          <div className="mp-color"><div><strong>Couleur</strong><span>Écru naturel</span></div><span className="mp-swatch" aria-label="Couleur écru naturel" /></div>

          <fieldset className={`mp-size-picker${sizeError ? " has-error" : ""}`} id="mantasoa-sizes">
            <legend><strong>Choisir la taille</strong><button type="button" onClick={() => document.getElementById("size-guide")?.showModal()}>Guide des tailles</button></legend>
            <div className="mp-sizes">
              {status === "loading" && SIZE_ORDER.slice(0, 5).map((size) => <span className="mp-size-skeleton" key={size} aria-hidden="true" />)}
              {sizes.map((size) => {
                const available = product ? remainingStock(product, size, cartItems) > 0 : true;
                return <button type="button" key={size} className={selectedSize === size ? "is-selected" : ""}
                  disabled={!available || !purchasable} onClick={() => { setSelectedSize(size); setQuantity(1); setSizeError(false); }}>
                  {size}<small>{available ? "" : "Épuisé"}</small>
                </button>;
              })}
            </div>
            {sizeError && <p className="mp-field-error" role="alert">Sélectionnez une taille avant de continuer.</p>}
            {selectedSize && stockForSize > 0 && stockForSize <= 3 && <p className="mp-low-stock">Plus que {stockForSize} en taille {selectedSize}</p>}
          </fieldset>

          <div className="mp-purchase-row">
            <div className="mp-quantity" aria-label="Quantité">
              <button type="button" aria-label="Diminuer la quantité" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
              <span aria-live="polite">{quantity}</span>
              <button type="button" aria-label="Augmenter la quantité" disabled={!selectedSize || quantity >= stockForSize} onClick={() => setQuantity((value) => value + 1)}>+</button>
            </div>
            <button type="button" className="mp-add" disabled={!purchasable} onClick={addSelection}>
              {purchasable ? "Ajouter au panier" : status === "loading" ? "Chargement…" : "Indisponible"}
              {price !== null && <span>{formatPrice(price * quantity)}</span>}
            </button>
          </div>
          <button type="button" className="mp-buy-now" disabled={!purchasable} onClick={buyNow}>Commander maintenant</button>
          {confirmation && <p className="mp-confirmation" role="status">Le Mantasoa a été ajouté à votre panier. <Link href="/panier">Voir le panier</Link></p>}
          {status === "error" && <p className="mp-load-note">Les informations de stock sont momentanément indisponibles. Réessayez dans quelques instants.</p>}
          {status === "empty" && <p className="mp-load-note">Cette pièce n’est pas encore ouverte à la commande.</p>}

          <ul className="mp-reassurance" aria-label="Services inclus">
            <li><span aria-hidden="true">◇</span><div><strong>Confection à la demande</strong><small>La confection démarre après votre commande</small></div></li>
            <li><span aria-hidden="true">↗</span><div><strong>Livraison suivie</strong><small>France métropolitaine et international selon disponibilité</small></div></li>
            <li><span aria-hidden="true">↺</span><div><strong>Retours sous 14 jours</strong><small>À compter de la réception de votre commande</small></div></li>
          </ul>

          <div className="mp-accordions">
            <details open><summary>Détails & composition <span>+</span></summary><p>{product?.details || "Maille douce en fibres naturelles, col rond, manches longues et finitions côtelées. Coupe droite légèrement ample. Chaque pièce est tricotée, assemblée et contrôlée à Antananarivo."}</p></details>
            <details><summary>Coupe & taille <span>+</span></summary><p>Coupe droite et confortable. Prenez votre taille habituelle pour un porté naturel, ou une taille au-dessus pour un volume plus généreux. Le mannequin porte une taille S.</p></details>
            <details><summary>Entretien <span>+</span></summary><p>{product?.careInstructions || "Lavage délicat à froid ou à la main. Essorage doux, séchage à plat et repassage à basse température. Ne pas utiliser de sèche-linge."}</p></details>
            <details><summary>Livraison & retours <span>+</span></summary><p>La confection démarre après votre commande. Vous recevez un suivi dès l’expédition. Les retours sont acceptés sous 14 jours sur les pièces non portées, dans leur état d’origine.</p></details>
          </div>
        </div>
      </section>

      <section className="mp-facts" aria-labelledby="mp-facts-title">
        <div className="mp-facts-heading">
          <p className="mp-kicker">Une pièce, longtemps</p>
          <h2 id="mp-facts-title">Le temps de bien faire.</h2>
        </div>
        <div className="mp-facts-grid">
          <article><span>01</span><h3>Origine</h3><p>Imaginé et confectionné à Antananarivo, Madagascar.</p></article>
          <article><span>02</span><h3>Fabrication</h3><p>Tricotage, assemblage et finitions réalisés avec soin dans l’atelier familial.</p></article>
          <article><span>03</span><h3>Production</h3><p>Chaque Mantasoa commence à prendre forme après votre commande.</p></article>
        </div>
      </section>

      <dialog className="mp-size-dialog" id="size-guide">
        <form method="dialog"><button className="mp-dialog-close" aria-label="Fermer le guide">×</button></form>
        <p className="mp-kicker">Bien choisir</p><h2>Guide des tailles</h2>
        <p>Le Mantasoa présente une coupe droite légèrement ample. Choisissez selon le tombé recherché :</p>
        <div className="mp-fit-guide">
          <div><strong>Votre taille habituelle</strong><span>Un tombé naturel et confortable</span></div>
          <div><strong>Une taille au-dessus</strong><span>Un porté plus ample et enveloppant</span></div>
          <div><strong>Une taille en dessous</strong><span>Un porté plus près du corps</span></div>
        </div>
        <small>Seules les tailles réellement renseignées et disponibles pour le produit peuvent être sélectionnées.</small>
      </dialog>
    </article>
  );
}
