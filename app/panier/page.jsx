"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../components/CartContext";
import { useState } from "react";
import { ButtonPrimary } from "../components/ui/Button";
import "./cart.css";

const PROMO_STORAGE_KEY = "pull-lover-promo";

export default function CartPage() {
  const { cartItems, increaseQty, decreaseQty, removeFromCart, cartTotal } = useCart();
  const router = useRouter();
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  const TVA_RATE = 0.20;
  const discount = promoApplied?.discount ?? 0;
  const discountedSubtotal = Math.max(0, cartTotal - discount);
  const tva = Math.round(discountedSubtotal * TVA_RATE);
  const total = discountedSubtotal + tva;
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
        setPromoError(data.error || "Code invalide");
        setPromoApplied(null);
        localStorage.removeItem(PROMO_STORAGE_KEY);
      } else {
        setPromoApplied(data);
        localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
        setPromoCode("");
      }
    } catch {
      setPromoError("Erreur réseau");
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

      <header className="cart-page-header">
        <p className="cart-eyebrow">Votre sélection</p>
        <h1>Mon panier<span>.</span></h1>
        <p className="cart-page-intro">
          Chaque Mantasoa est fabriqué à la demande dans notre atelier familial à Antananarivo.
        </p>
      </header>

      {cartItems.length === 0 ? (
        <div className="cart-empty">
          <p className="cart-empty-kicker">Votre sélection est vide</p>
          <h2>Le Mantasoa vous attend.</h2>
          <p>Une maille essentielle, tricotée uniquement quand vous la choisissez.</p>
          <Link href="/#piece">Découvrir la pièce <span aria-hidden="true">→</span></Link>
        </div>
      ) : (
        <div className="cart-wrapper">

          {/* COLONNE GAUCHE */}
          <div className="cart-left">
            <div className="cart-list-heading">
              <h2 className="cart-title">Votre sélection</h2>
              <span>{totalQty} article{totalQty > 1 ? "s" : ""}</span>
            </div>

            <ul className="cart-list">
              {cartItems.map((item) => (
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
                        {item.size && <span>Taille : {item.size}</span>}
                        {item.size && item.color && " · "}
                        {item.color && <span>Couleur : {item.color}</span>}
                      </p>
                    )}
                    <div className="qty-controls">
                      <button aria-label={`Diminuer la quantité de ${item.name}`} onClick={() => decreaseQty(item.cartKey)} disabled={item.quantity === 0}>−</button>
                      <span aria-live="polite">{item.quantity}</span>
                      <button aria-label={`Augmenter la quantité de ${item.name}`} onClick={() => increaseQty(item.cartKey)}>+</button>
                    </div>
                  </div>

                  {/* PRIX + REMOVE */}
                  <div className="cart-item-right">
                    {item.promoPrice ? (
                      <div className="cart-item-prices">
                        <span className="cart-item-price cart-item-price--promo">{Number(item.promoPrice).toLocaleString("fr-FR")} €</span>
                        <span className="cart-item-price--original">{Number(item.price).toLocaleString("fr-FR")} €</span>
                        <span className="cart-item-saving">−{((Number(item.price) - Number(item.promoPrice)) * item.quantity).toLocaleString("fr-FR")} €</span>
                      </div>
                    ) : (
                      <span className="cart-item-price">{Number(item.price).toLocaleString("fr-FR")} €</span>
                    )}
                    <button className="cart-remove-btn" onClick={() => removeFromCart(item.cartKey)} aria-label="Supprimer l'article">
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
          <div className="cart-right">
            <div className="cart-promo">
              <h3 className="cart-section-title">Code promo</h3>

              {promoApplied ? (
                <div className="promo-applied">
                  <div className="promo-applied-info">
                    <span className="promo-applied-code">{promoApplied.code}</span>
                    <span className="promo-applied-desc">
                      {promoApplied.type === "percentage"
                        ? `−${promoApplied.value}%`
                        : `−${promoApplied.value} €`}
                      {promoApplied.description ? ` · ${promoApplied.description}` : ""}
                    </span>
                  </div>
                  <button className="promo-remove-btn" onClick={handleRemovePromo} aria-label="Retirer le code promo">
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
                      placeholder="Entrez votre code"
                      aria-label="Code promo"
                      value={promoCode}
                      onChange={(e) => { setPromoCode(e.target.value); setPromoError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                    />
                    <button onClick={handleApplyPromo} disabled={promoLoading || !promoCode.trim()}>
                      {promoLoading ? "…" : "Appliquer"}
                    </button>
                  </div>
                  {promoError && <p className="promo-error">{promoError}</p>}
                </>
              )}
            </div>

            <div className="cart-summary">
              <h3 className="cart-section-title">Résumé</h3>
              <div className="summary-row">
                <span>Sous-total ({totalQty} article{totalQty > 1 ? "s" : ""})</span>
                <span>{cartTotal} €</span>
              </div>
              {promoSavings > 0 && (
                <div className="summary-row summary-discount">
                  <span>Réduction produits</span>
                  <span>−{promoSavings.toLocaleString("fr-FR")} €</span>
                </div>
              )}
              {promoApplied && (
                <div className="summary-row summary-discount">
                  <span>Remise ({promoApplied.code})</span>
                  <span>−{discount} €</span>
                </div>
              )}
              <div className="summary-row">
                <span>TVA (20%)</span>
                <span>{tva} €</span>
              </div>
              <div className="summary-divider" />
              <div className="summary-row summary-total">
                <span>Total</span>
                <span>{total} €</span>
              </div>
              {hasZeroQty && (
                <p className="cart-quantity-warning">
                  Un article a une quantité de 0. Supprimez-le ou augmentez la quantité.
                </p>
              )}
              <ButtonPrimary className="cart-checkout-button" full onClick={() => router.push("/checkout")} disabled={hasZeroQty}>
                Procéder au paiement <span aria-hidden="true">→</span>
              </ButtonPrimary>
              <p className="cart-made-to-order">Fabriqué à la demande · Paiement sécurisé</p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
