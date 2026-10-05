"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/app/components/CartContext";
import { productSizes, remainingStock, selectFeaturedProduct } from "@/app/lib/featured-product.mjs";
import { useLang } from "@/app/i18n/I18nProvider";
import { localePath } from "@/app/i18n/config.mjs";
import { formatPrice } from "@/app/i18n/format.mjs";
import { localizeProduct } from "@/app/i18n/product.mjs";

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];

const CARDIGAN_VARIANTS = [
  {
    id: "vert-foret",
    code: "#284a37",
    name: { fr: "Vert forêt", en: "Forest green" },
    images: [
      "/api/media/products/cardigan-maille-milano/cardigan-vert-mannequin-broderie-v4.webp",
      "/api/media/products/cardigan-maille-milano/cardigan-vert-face-broderie-v4.webp",
      "/api/media/products/cardigan-maille-milano/cardigan-vert-dos-broderie-v4.webp",
      "/api/media/products/cardigan-maille-milano/cardigan-vert-coeur-broderie-v4.webp",
    ],
  },
  {
    id: "bleu-ciel",
    code: "#a9c7e8",
    name: { fr: "Bleu ciel", en: "Sky blue" },
    images: [
      "/api/media/products/cardigan-maille-milano/cardigan-bleu-mannequin-harmonise-v5.webp",
      "/api/media/products/cardigan-maille-milano/cardigan-bleu-face-broderie-v4.webp",
      "/api/media/products/cardigan-maille-milano/cardigan-bleu-dos-broderie-v4.webp",
      "/api/media/products/cardigan-maille-milano/cardigan-bleu-coeur-broderie-v4.webp",
    ],
  },
  {
    id: "gris-anthracite",
    code: "#3d3d3f",
    name: { fr: "Gris anthracite", en: "Anthracite grey" },
    images: [
      "/api/media/products/cardigan-maille-milano/cardigan-anthracite-mannequin-broderie-v4.webp",
      "/api/media/products/cardigan-maille-milano/cardigan-anthracite-face-broderie-v4.webp",
      "/api/media/products/cardigan-maille-milano/cardigan-anthracite-dos-broderie-v4.webp",
      "/api/media/products/cardigan-maille-milano/cardigan-anthracite-coeur-broderie-v4.webp",
    ],
  },
];

const TEXT = {
  fr: {
    mainAlt: "Le cardigan porté",
    fallbackAlts: ["Le cardigan écru porté au bord du lac", "Le cardigan écru vu de face", "Détail de la maille et du col"],
    view: (name, index) => `${name} — vue ${index}`,
    fallbackName: "Cardigan en maille milano",
    breadcrumb: "Fil d’Ariane",
    home: "Accueil",
    views: "Vues du produit",
    showView: (index) => `Afficher la vue ${index}`,
    previous: "Photo précédente",
    next: "Photo suivante",
    kicker: "Maille de Madagascar · Pièce n° 01",
    madeToOrder: "Fabriqué à la demande",
    priceNote: "Hors taxes · total au panier",
    fallbackDescription: <>Tricoté dans le <strong>Dorotea</strong>, un fil d’exception de la filature italienne <strong>Filatura Papi Fabio</strong>, ce cardigan associe 90 % de laine mérinos ultrafine et 10 % de cachemire. Sa maille milano, dense et structurée, lui donne une belle tenue : il garde sa forme, porté après porté. Coupe oversize et col rond, pour un basique aussi confortable qu’intemporel.</>,
    color: "Couleur",
    colorLabel: (color) => `Couleur ${color}`,
    chooseSize: "Choisir la taille",
    sizeGuide: "Guide des tailles",
    soldOut: "Épuisé",
    sizeError: "Sélectionnez une taille avant de continuer.",
    lowStock: (count, size) => `Plus que ${count} en taille ${size}`,
    quantity: "Quantité",
    decrease: "Diminuer la quantité",
    increase: "Augmenter la quantité",
    addToCart: "Ajouter au panier",
    loading: "Chargement…",
    unavailable: "Indisponible",
    buyNow: "Commander maintenant",
    added: "Le cardigan a été ajouté à votre panier.",
    viewCart: "Voir le panier",
    loadError: "Les informations de stock sont momentanément indisponibles. Réessayez dans quelques instants.",
    notOpen: "Cette pièce n’est pas encore ouverte à la commande.",
    services: "Services inclus",
    reassurance: [
      ["◇", "Confection à la demande", "La confection démarre après votre commande"],
      ["↗", "Livraison suivie", "France métropolitaine et international selon disponibilité"],
      ["↺", "Retours sous 14 jours", "À compter de la réception de votre commande"],
    ],
    fitTitle: "Coupe & taille",
    fitFallback: "Coupe oversize, ample et confortable. Prenez votre taille habituelle pour retrouver ce volume, ou une taille en dessous pour un porté plus près du corps. Le mannequin porte une taille S.",
    careTitle: "Entretien",
    careFallback: "Lavage délicat à froid ou à la main. Essorage doux, séchage à plat et repassage à basse température. Ne pas utiliser de sèche-linge.",
    shippingTitle: "Livraison & retours",
    shippingFallback: "La confection démarre après votre commande. Vous recevez un suivi dès l’expédition. Les retours sont acceptés sous 14 jours sur les pièces non portées, dans leur état d’origine.",
    factsKicker: "La passion de la maille",
    factsTitle: "Le temps de bien faire.",
    facts: [
      ["Origine", "Imaginé et confectionné à Antananarivo, Madagascar."],
      ["Fabrication", "Tricotage, assemblage et finitions réalisés avec soin dans notre atelier familial."],
      ["Production", "Chaque pièce commence à prendre forme après votre commande."],
    ],
    closeGuide: "Fermer le guide",
    guideKicker: "Bien choisir",
    guideIntro: "Le cardigan présente une coupe oversize. Choisissez selon le tombé recherché :",
    guideRows: [
      ["Votre taille habituelle", "Un tombé naturel et confortable"],
      ["Une taille au-dessus", "Un porté plus ample et enveloppant"],
      ["Une taille en dessous", "Un porté plus près du corps"],
    ],
    guideNote: "Seules les tailles réellement renseignées et disponibles pour le produit peuvent être sélectionnées.",
  },
  en: {
    mainAlt: "The cardigan, worn",
    fallbackAlts: ["The ecru cardigan worn by the lake", "The ecru cardigan, front view", "Close-up of the knit and collar"],
    view: (name, index) => `${name} — view ${index}`,
    fallbackName: "Milano knit cardigan",
    breadcrumb: "Breadcrumb",
    home: "Home",
    views: "Product views",
    showView: (index) => `Show view ${index}`,
    previous: "Previous photo",
    next: "Next photo",
    kicker: "Knitwear from Madagascar · Piece no. 01",
    madeToOrder: "Made to order",
    priceNote: "Excl. VAT · total in your cart",
    fallbackDescription: <>Knitted in <strong>Dorotea</strong>, an exceptional yarn from the Italian spinning mill <strong>Filatura Papi Fabio</strong>, this cardigan blends 90% ultrafine merino wool with 10% cashmere. Its dense, structured milano stitch gives it lasting shape, wear after wear. An oversized cut and crew neck make it a basic as comfortable as it is timeless.</>,
    color: "Colour",
    colorLabel: (color) => `Colour ${color}`,
    chooseSize: "Choose your size",
    sizeGuide: "Size guide",
    soldOut: "Sold out",
    sizeError: "Please select a size to continue.",
    lowStock: (count, size) => `Only ${count} left in size ${size}`,
    quantity: "Quantity",
    decrease: "Decrease quantity",
    increase: "Increase quantity",
    addToCart: "Add to cart",
    loading: "Loading…",
    unavailable: "Unavailable",
    buyNow: "Order now",
    added: "The cardigan has been added to your cart.",
    viewCart: "View cart",
    loadError: "Stock information is temporarily unavailable. Please try again in a moment.",
    notOpen: "This piece is not open for orders yet.",
    services: "Included services",
    reassurance: [
      ["◇", "Made to order", "Production starts once you place your order"],
      ["↗", "Tracked delivery", "Mainland France and international, depending on availability"],
      ["↺", "14-day returns", "From the day you receive your order"],
    ],
    fitTitle: "Fit & sizing",
    fitFallback: "Oversized, roomy and comfortable cut. Take your usual size for this relaxed volume, or one size down for a closer fit. The model wears a size S.",
    careTitle: "Care",
    careFallback: "Gentle cold wash or hand wash. Spin gently, dry flat and iron at low temperature. Do not tumble dry.",
    shippingTitle: "Shipping & returns",
    shippingFallback: "Production starts once you place your order. You receive tracking as soon as it ships. Returns are accepted within 14 days on unworn pieces in their original condition.",
    factsKicker: "A passion for knitwear",
    factsTitle: "Taking the time to do it right.",
    facts: [
      ["Origin", "Designed and made in Antananarivo, Madagascar."],
      ["Craft", "Knitting, assembly and finishing carefully done in our family workshop."],
      ["Production", "Each piece starts taking shape after you order."],
    ],
    closeGuide: "Close the guide",
    guideKicker: "Finding your fit",
    guideIntro: "The cardigan has an oversized cut. Choose based on the fit you want:",
    guideRows: [
      ["Your usual size", "A natural, comfortable fit"],
      ["One size up", "A roomier, cosier fit"],
      ["One size down", "A closer fit"],
    ],
    guideNote: "Only sizes actually listed and available for this product can be selected.",
  },
};


// initialState : calculé au rendu serveur ; absent (base injoignable), le produit est chargé ici.
export default function MantasoaProductPage({ initialState = null }) {
  const lang = useLang();
  const t = TEXT[lang];
  const href = (path) => localePath(lang, path);
  const router = useRouter();
  const { addToCart, cartItems } = useCart();
  const [status, setStatus] = useState(initialState?.status ?? "loading");
  const [product, setProduct] = useState(initialState?.product ?? null);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(CARDIGAN_VARIANTS[0].id);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [confirmation, setConfirmation] = useState(false);

  useEffect(() => {
    if (initialState) return undefined;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    fetch("/api/products?limit=20", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Produit indisponible");
        const data = await response.json();
        const match = selectFeaturedProduct(data.products || []);
        setProduct(match);
        setStatus(match ? "ready" : "empty");
      })
      .catch(() => setStatus("error"))
      .finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [initialState]);

  // Textes affichés dans la langue de la page ; `product` garde les valeurs françaises envoyées à la commande
  const display = useMemo(() => localizeProduct(product, lang), [product, lang]);
  const selectedVariant = useMemo(
    () => CARDIGAN_VARIANTS.find((variant) => variant.id === selectedColor) || CARDIGAN_VARIANTS[0],
    [selectedColor],
  );
  const images = useMemo(
    () => selectedVariant.images.map((src, index) => ({
      src,
      alt: index === 0
        ? `${t.mainAlt} — ${selectedVariant.name[lang]}`
        : t.view(`${display?.name || t.fallbackName} — ${selectedVariant.name[lang]}`, index + 1),
      contain: index > 0,
    })),
    [display?.name, lang, selectedVariant, t],
  );
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
        image: images[0].src,
        quantity: 1, size: selectedSize, color: selectedVariant.name.fr, stock: product.stock,
        // Nom et couleur en anglais pour l'affichage du panier (le panier survit aux changements de langue)
        translations: {
          en: {
            name: product.translations?.en?.name || "",
            color: selectedVariant.name.en,
          },
        },
      });
    }
    setConfirmation(true);
    window.setTimeout(() => setConfirmation(false), 2600);
    return true;
  }

  function buyNow() {
    if (addSelection()) router.push(href("/checkout"));
  }

  return (
    <article className="mp-page">
      <nav className="mp-breadcrumb" aria-label={t.breadcrumb} data-reveal>
        <Link href={href("/")}>{t.home}</Link><span>/</span><span>{t.fallbackName}</span>
      </nav>

      <section className="mp-buy" aria-labelledby="mantasoa-title">
        <div className="mp-gallery" data-reveal>
          <div className="mp-thumbnails" aria-label={t.views}>
            {images.map((image, index) => (
              <button type="button" key={image.src} className={activeImage === index ? "is-active" : ""}
                onClick={() => setActiveImage(index)} aria-label={t.showView(index + 1)} aria-pressed={activeImage === index}>
                <Image src={image.src} alt="" fill sizes="84px" />
              </button>
            ))}
          </div>
          <div className="mp-main-image">
            <Image className={images[activeImage].contain ? "is-contain" : ""} src={images[activeImage].src} alt={images[activeImage].alt} fill priority={activeImage === 0} sizes="(max-width: 900px) 100vw, 56vw" />
            <span className="mp-image-count">{activeImage + 1} / {images.length}</span>
            {images.length > 1 && <div className="mp-image-arrows">
              <button type="button" aria-label={t.previous} onClick={() => setActiveImage((activeImage - 1 + images.length) % images.length)}>←</button>
              <button type="button" aria-label={t.next} onClick={() => setActiveImage((activeImage + 1) % images.length)}>→</button>
            </div>}
          </div>
        </div>

        <div className="mp-panel" data-reveal-stagger>
          <p className="mp-kicker">{t.kicker}</p>
          <div className="mp-heading-row">
            <h1 id="mantasoa-title">{t.fallbackName}</h1>
            <span className="mp-made"><i aria-hidden="true" />{t.madeToOrder}</span>
          </div>
          <div className="mp-price-row">
            {price !== null ? <p className="mp-price">{formatPrice(price, lang)}
              {product?.promoPrice != null && Number(product.promoPrice) < Number(product.price) && <del>{formatPrice(product.price, lang)}</del>}
            </p> : <span className="mp-price-placeholder" />}
            <span>{t.priceNote}</span>
          </div>
          <p className="mp-lead">{display?.description || t.fallbackDescription}</p>

          <div className="mp-color">
            <div className="mp-color-copy"><strong>{t.color}</strong><span>{selectedVariant.name[lang]}</span></div>
            <div className="mp-swatches" aria-label={t.color}>
              {CARDIGAN_VARIANTS.map((variant) => (
                <button
                  type="button"
                  key={variant.id}
                  className={`mp-swatch${selectedColor === variant.id ? " is-selected" : ""}`}
                  style={{ "--swatch-color": variant.code }}
                  aria-label={t.colorLabel(variant.name[lang])}
                  aria-pressed={selectedColor === variant.id}
                  title={variant.name[lang]}
                  onClick={() => {
                    setSelectedColor(variant.id);
                    setActiveImage(0);
                    setConfirmation(false);
                  }}
                />
              ))}
            </div>
          </div>

          <fieldset className={`mp-size-picker${sizeError ? " has-error" : ""}`} id="mantasoa-sizes">
            <legend><strong>{t.chooseSize}</strong><button type="button" onClick={() => document.getElementById("size-guide")?.showModal()}>{t.sizeGuide}</button></legend>
            <div className="mp-sizes">
              {status === "loading" && SIZE_ORDER.slice(0, 5).map((size) => <span className="mp-size-skeleton" key={size} aria-hidden="true" />)}
              {sizes.map((size) => {
                const available = product ? remainingStock(product, size, cartItems) > 0 : true;
                return <button type="button" key={size} className={selectedSize === size ? "is-selected" : ""}
                  disabled={!available || !purchasable} onClick={() => { setSelectedSize(size); setQuantity(1); setSizeError(false); }}>
                  {size}<small>{available ? "" : t.soldOut}</small>
                </button>;
              })}
            </div>
            {sizeError && <p className="mp-field-error" role="alert">{t.sizeError}</p>}
            {selectedSize && stockForSize > 0 && stockForSize <= 3 && <p className="mp-low-stock">{t.lowStock(stockForSize, selectedSize)}</p>}
          </fieldset>

          <div className="mp-purchase-row">
            <div className="mp-quantity" aria-label={t.quantity}>
              <button type="button" aria-label={t.decrease} onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
              <span aria-live="polite">{quantity}</span>
              <button type="button" aria-label={t.increase} disabled={!selectedSize || quantity >= stockForSize} onClick={() => setQuantity((value) => value + 1)}>+</button>
            </div>
            <button type="button" className="mp-add" disabled={!purchasable} onClick={addSelection}>
              {purchasable ? t.addToCart : status === "loading" ? t.loading : t.unavailable}
              {price !== null && <span>{formatPrice(price * quantity, lang)}</span>}
            </button>
          </div>
          <button type="button" className="mp-buy-now" disabled={!purchasable} onClick={buyNow}>{t.buyNow}</button>
          {confirmation && <p className="mp-confirmation" role="status">{t.added} <Link href={href("/panier")}>{t.viewCart}</Link></p>}
          {status === "error" && <p className="mp-load-note">{t.loadError}</p>}
          {status === "empty" && <p className="mp-load-note">{t.notOpen}</p>}

          <ul className="mp-reassurance" aria-label={t.services}>
            {t.reassurance.map(([icon, title, text]) => (
              <li key={title}><span aria-hidden="true">{icon}</span><div><strong>{title}</strong><small>{text}</small></div></li>
            ))}
          </ul>

          <div className="mp-accordions">
            <details><summary>{t.fitTitle} <span>+</span></summary><p>{display?.fitInfo || t.fitFallback}</p></details>
            <details><summary>{t.careTitle} <span>+</span></summary><p>{display?.careInstructions || t.careFallback}</p></details>
            <details><summary>{t.shippingTitle} <span>+</span></summary><p>{display?.shippingInfo || t.shippingFallback}</p></details>
          </div>
        </div>
      </section>

      <section className="mp-facts" aria-labelledby="mp-facts-title">
        <div className="mp-facts-heading" data-reveal-stagger>
          <p className="mp-kicker">{t.factsKicker}</p>
          <h2 id="mp-facts-title">{t.factsTitle}</h2>
        </div>
        <div className="mp-facts-grid" data-reveal-stagger>
          {t.facts.map(([title, text], index) => (
            <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{text}</p></article>
          ))}
        </div>
      </section>

      <dialog className="mp-size-dialog" id="size-guide">
        <form method="dialog"><button className="mp-dialog-close" aria-label={t.closeGuide}>×</button></form>
        <p className="mp-kicker">{t.guideKicker}</p><h2>{t.sizeGuide}</h2>
        <p>{t.guideIntro}</p>
        <div className="mp-fit-guide">
          {t.guideRows.map(([title, text]) => <div key={title}><strong>{title}</strong><span>{text}</span></div>)}
        </div>
        <small>{t.guideNote}</small>
      </dialog>
    </article>
  );
}
