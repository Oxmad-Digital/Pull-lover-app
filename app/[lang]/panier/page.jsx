"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/app/components/CartContext";
import { useEffect, useState } from "react";
import { ButtonPrimary } from "@/app/components/ui/Button";
import { applicablePromo, computeTotals, PROMO_STORAGE_KEY, readStoredPromo } from "@/app/lib/pricing.mjs";
import { useLang } from "@/app/i18n/I18nProvider";
import { localePath } from "@/app/i18n/config.mjs";
import { formatMoney } from "@/app/i18n/format.mjs";
import { localizeProduct } from "@/app/i18n/product.mjs";
import "./cart.css";

const TEXT = {
  fr: {
    eyebrow: "Votre sélection",
    title: "Mon panier",
    intro: "Chaque cardigan est fabriqué à la demande dans notre atelier familial à Antananarivo.",
    emptyKicker: "Votre sélection est vide",
    emptyTitle: "Le cardigan vous attend.",
    emptyText: "Une maille essentielle, tricotée uniquement quand vous la choisissez.",
    discover: "Découvrir la pièce",
    items: (count) => `${count} article${count > 1 ? "s" : ""}`,
    size: "Taille",
    color: "Couleur",
    decrease: (name) => `Diminuer la quantité de ${name}`,
    increase: (name) => `Augmenter la quantité de ${name}`,
    remove: "Supprimer l'article",
    promoTitle: "Code promo",
    removePromo: "Retirer le code promo",
    promoPlaceholder: "Entrez votre code",
    apply: "Appliquer",
    invalidCode: "Code invalide",
    networkError: "Erreur réseau",
    summary: "Résumé",
    subtotal: (count) => `Sous-total (${count} article${count > 1 ? "s" : ""})`,
    productDiscount: "Réduction produits",
    discount: (code) => `Remise (${code})`,
    minNotReached: (code, amount) => `Code ${code} : montant minimum de ${amount} non atteint.`,
    vat: "TVA (20%)",
    zeroQty: "Un article a une quantité de 0. Supprimez-le ou augmentez la quantité.",
    checkout: "Procéder au paiement",
    madeToOrder: "Fabriqué à la demande · Paiement sécurisé",
  },
  en: {
    eyebrow: "Your selection",
    title: "My cart",
    intro: "Each cardigan is made to order in our family workshop in Antananarivo.",
    emptyKicker: "Your selection is empty",
    emptyTitle: "The cardigan is waiting for you.",
    emptyText: "An essential knit, made only once you choose it.",
    discover: "Discover the piece",
    items: (count) => `${count} item${count > 1 ? "s" : ""}`,
    size: "Size",
    color: "Colour",
    decrease: (name) => `Decrease quantity of ${name}`,
    increase: (name) => `Increase quantity of ${name}`,
    remove: "Remove item",
    promoTitle: "Promo code",
    removePromo: "Remove promo code",
    promoPlaceholder: "Enter your code",
    apply: "Apply",
    invalidCode: "Invalid code",
    networkError: "Network error",
    summary: "Summary",
    subtotal: (count) => `Subtotal (${count} item${count > 1 ? "s" : ""})`,
    productDiscount: "Product discount",
    discount: (code) => `Discount (${code})`,
    minNotReached: (code, amount) => `Code ${code}: minimum order of ${amount} not reached.`,
    vat: "VAT (20%)",
    zeroQty: "An item has a quantity of 0. Remove it or increase the quantity.",
    checkout: "Proceed to checkout",
    madeToOrder: "Made to order · Secure payment",
  },
};

export default function CartPage() {
  const lang = useLang();
  const t = TEXT[lang];
  const money = (value) => formatMoney(value, lang);
  const { cartItems, increaseQty, decreaseQty, removeFromCart, cartTotal } = useCart();
  const router = useRouter();
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  // Code promo déjà validé (conservé 24 h) : restauré pour afficher le même total qu'au checkout
  useEffect(() => {
    const stored = readStoredPromo();
    if (stored) setPromoApplied(stored);
  }, []);

  // Remise recalculée à chaque changement du panier (même calcul que le serveur)
  const activePromo = applicablePromo(promoApplied, cartTotal);
  const { discount, tva, total } = computeTotals({ subtotal: cartTotal, promo: activePromo });
  const totalQty = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const hasZeroQty = cartItems.some((i) => i.quantity === 0);
  const promoSavings = cartItems.reduce((acc, i) => {
    if (i.promoPrice) return acc + (Number(i.price) - Number(i.promoPrice)) * i.quantity;
    return acc;
  }, 0);

  async function handleApplyPromo() {
    const code = promoCode.trim();
    if (!code) return;
    setPromoError("");
    setPromoLoading(true);
    try {
      const res = await fetch("/api/promos/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, orderAmount: cartTotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPromoError(data.error || t.invalidCode);
        setPromoApplied(null);
        localStorage.removeItem(PROMO_STORAGE_KEY);
      } else {
        setPromoApplied(data);
        localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
        setPromoCode("");
      }
    } catch {
      setPromoError(t.networkError);
    } finally {
      setPromoLoading(false);
    }
  }

  function handleRemovePromo() {
    setPromoApplied(null);
    setPromoCode("");
    setPromoError("");
    localStorage.removeItem(PROMO_STORAGE_KEY);
  }

  return (
    <div className="cart-page">

      <header className="cart-page-header" data-reveal-stagger>
        <p className="cart-eyebrow">{t.eyebrow}</p>
        <h1>{t.title}<span>.</span></h1>
        <p className="cart-page-intro">{t.intro}</p>
      </header>

      {cartItems.length === 0 ? (
        <div className="cart-empty" data-reveal-stagger>
          <p className="cart-empty-kicker">{t.emptyKicker}</p>
          <h2>{t.emptyTitle}</h2>
          <p>{t.emptyText}</p>
          <Link href={localePath(lang, "/#piece")}>{t.discover} <span aria-hidden="true">→</span></Link>
        </div>
      ) : (
        <div className="cart-wrapper">

          {/* COLONNE GAUCHE */}
          <div className="cart-left">
            <div className="cart-list-heading" data-reveal>
              <h2 className="cart-title">{t.eyebrow}</h2>
              <span>{t.items(totalQty)}</span>
            </div>

            <ul className="cart-list" data-reveal-stagger>
              {cartItems.map((cartItem) => localizeProduct(cartItem, lang)).map((item) => (
                <li key={item.cartKey} className="cart-item">

                  {/* IMAGE */}
                  <div className="cart-item-image">
                    {item.image ? <img src={item.image} alt={item.name} /> : <span aria-hidden="true">PL</span>}
                  </div>

                  {/* NOM + TAILLE + COULEUR + QTY */}
                  <div className="cart-item-info">
                    <strong>{item.name}</strong>
                    {(item.size || item.color) && (
                      <p className="cart-item-variant">
                        {item.size && <span>{t.size}{lang === "fr" ? " : " : ": "}{item.size}</span>}
                        {item.size && item.color && " · "}
                        {item.color && <span>{t.color}{lang === "fr" ? " : " : ": "}{item.color}</span>}
                      </p>
                    )}
                    <div className="qty-controls">
                      <button aria-label={t.decrease(item.name)} onClick={() => decreaseQty(item.cartKey)} disabled={item.quantity === 0}>−</button>
                      <span aria-live="polite">{item.quantity}</span>
                      <button aria-label={t.increase(item.name)} onClick={() => increaseQty(item.cartKey)}>+</button>
                    </div>
                  </div>

                  {/* PRIX + REMOVE */}
                  <div className="cart-item-right">
                    {item.promoPrice ? (
                      <div className="cart-item-prices">
                        <span className="cart-item-price cart-item-price--promo">{money(item.promoPrice)}</span>
                        <span className="cart-item-price--original">{money(item.price)}</span>
                        <span className="cart-item-saving">−{money((Number(item.price) - Number(item.promoPrice)) * item.quantity)}</span>
                      </div>
                    ) : (
                      <span className="cart-item-price">{money(item.price)}</span>
                    )}
                    <button className="cart-remove-btn" onClick={() => removeFromCart(item.cartKey)} aria-label={t.remove}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </div>

                </li>
              ))}
            </ul>
          </div>

          {/* COLONNE DROITE */}
          <div className="cart-right" data-reveal-stagger>
            <div className="cart-promo">
              <h3 className="cart-section-title">{t.promoTitle}</h3>

              {promoApplied ? (
                <div className="promo-applied">
                  <div className="promo-applied-info">
                    <span className="promo-applied-code">{promoApplied.code}</span>
                    <span className="promo-applied-desc">
                      {promoApplied.type === "percentage"
                        ? `−${promoApplied.value}%`
                        : `−${money(promoApplied.value)}`}
                      {promoApplied.description ? ` · ${promoApplied.description}` : ""}
                    </span>
                  </div>
                  <button className="promo-remove-btn" onClick={handleRemovePromo} aria-label={t.removePromo}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <div className="promo-input-row">
                    <input
                      type="text"
                      placeholder={t.promoPlaceholder}
                      aria-label={t.promoTitle}
                      value={promoCode}
                      onChange={(e) => { setPromoCode(e.target.value); setPromoError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                    />
                    <button onClick={handleApplyPromo} disabled={promoLoading || !promoCode.trim()}>
                      {promoLoading ? "…" : t.apply}
                    </button>
                  </div>
                  {promoError && <p className="promo-error">{promoError}</p>}
                </>
              )}
            </div>

            <div className="cart-summary">
              <h3 className="cart-section-title">{t.summary}</h3>
              <div className="summary-row">
                <span>{t.subtotal(totalQty)}</span>
                <span>{money(cartTotal)}</span>
              </div>
              {promoSavings > 0 && (
                <div className="summary-row summary-discount">
                  <span>{t.productDiscount}</span>
                  <span>−{money(promoSavings)}</span>
                </div>
              )}
              {activePromo && (
                <div className="summary-row summary-discount">
                  <span>{t.discount(activePromo.code)}</span>
                  <span>−{money(discount)}</span>
                </div>
              )}
              {promoApplied && !activePromo && (
                <p className="promo-error">
                  {t.minNotReached(promoApplied.code, money(promoApplied.minOrderAmount))}
                </p>
              )}
              <div className="summary-row">
                <span>{t.vat}</span>
                <span>{money(tva)}</span>
              </div>
              <div className="summary-divider" />
              <div className="summary-row summary-total">
                <span>Total</span>
                <span>{money(total)}</span>
              </div>
              {hasZeroQty && (
                <p className="cart-quantity-warning">
                  {t.zeroQty}
                </p>
              )}
              <ButtonPrimary className="cart-checkout-button" full onClick={() => router.push(localePath(lang, "/checkout"))} disabled={hasZeroQty}>
                {t.checkout} <span aria-hidden="true">→</span>
              </ButtonPrimary>
              <p className="cart-made-to-order">{t.madeToOrder}</p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
