"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useFavorites } from "../components/FavoritesContext";
import { useCart } from "../components/CartContext";
import { ButtonPrimary, ButtonSecondary, ButtonGhost } from "../components/ui/Button";
import { BadgePromo } from "../components/ui/Tag";
import "./favoris.css";

export default function FavorisPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { favorites, removeFavorite, loading } = useFavorites();
  const { addToCart } = useCart();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login?callbackUrl=/favoris");
    }
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="favoris-page">
        <div className="favoris-bg"><span /><span /><span /><span /></div>
        <div className="favoris-inner">
          <div className="favoris-header">
            <h1 className="favoris-title">Mes favoris</h1>
          </div>
          <div className="favoris-empty">
            <p>Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="favoris-page">

      {/* Fond orbes animés */}
      <div className="favoris-bg">
        <span /><span /><span /><span />
      </div>

      <div className="favoris-inner">

        {/* HEADER */}
        <div className="favoris-header">
          <h1 className="favoris-title">Mes favoris</h1>
          <p className="favoris-count">
            {favorites.length} article{favorites.length !== 1 ? "s" : ""}
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className="favoris-empty">
            <div className="favoris-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" width="64" height="64">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <h2>Votre liste de favoris est vide</h2>
            <p>Retrouvez ici les pièces que vous avez enregistrées.</p>
            <ButtonPrimary href="/#piece">
              Découvrir le Mantasoa
            </ButtonPrimary>
          </div>
        ) : (
          <>
            <div className="favoris-grid">
              {favorites.map((product) => {
                const colorCount = product.colors?.length ?? null;
                const displayPrice = product.promoPrice ?? product.price;
                const hasPromo = !!product.promoPrice;
                const discountPct = hasPromo
                  ? Math.round(((product.price - product.promoPrice) / product.price) * 100)
                  : null;

                return (
                  <div className="fav-card" key={product._id}>

                    {/* IMAGE */}
                    <div className="fav-image-wrap">
                      {hasPromo && (
                        <BadgePromo>-{discountPct}%</BadgePromo>
                      )}
                      <button
                        className="fav-remove-icon"
                        onClick={() => removeFavorite(product._id)}
                        aria-label="Retirer des favoris"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                      <Link href={`/products/${product._id}`}>
                        <Image
                          src={product.image || "/no-image.png"}
                          alt={product.name}
                          width={400}
                          height={480}
                          className="fav-img"
                        />
                      </Link>
                    </div>

                    {/* INFOS */}
                    <div className="fav-info">
                      <Link href={`/products/${product._id}`} className="fav-name">
                        {product.name}
                      </Link>

                      <div className="fav-price">
                        {hasPromo ? (
                          <>
                            <span className="fav-price-promo">{product.promoPrice.toLocaleString()} €</span>
                            <span className="fav-price-old">{product.price.toLocaleString()} €</span>
                          </>
                        ) : (
                          <span className="fav-price-normal">{product.price.toLocaleString()} €</span>
                        )}
                      </div>

                      {colorCount !== null && colorCount > 0 && (
                        <p className="fav-colors">
                          {colorCount} couleur{colorCount > 1 ? "s" : ""}
                        </p>
                      )}

                      <div className="fav-actions">
                        <ButtonPrimary
                          full
                          disabled={!product.isAvailable || product.stock === 0}
                          onClick={() =>
                            addToCart({
                              _id: product._id,
                              name: product.name,
                              price: displayPrice,
                              image: product.image,
                              quantity: 1,
                              stock: product.stock,
                            })
                          }
                        >
                          {product.stock === 0 ? "Rupture de stock" : "Ajouter au panier"}
                        </ButtonPrimary>
                        <ButtonSecondary
                          size="sm"
                          onClick={() => removeFavorite(product._id)}
                        >
                          Retirer
                        </ButtonSecondary>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            <div className="favoris-footer">
              <ButtonGhost href="/#piece" style={{ color: '#C75C5C' }}>
                Continuer mes achats
              </ButtonGhost>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
