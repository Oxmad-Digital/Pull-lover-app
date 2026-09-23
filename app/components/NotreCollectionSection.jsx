"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ButtonPrimary } from "./ui/Button";
import { Eyebrow, BadgePromo } from "./ui/Tag";
import { useFavorites } from "./FavoritesContext";
import "./NotreCollectionSection.css";

const NotreCollectionSection = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toggleFavorite, isFavorite } = useFavorites();

    useEffect(() => {
        async function loadProducts() {
            try {
                const res = await fetch("/api/products?limit=8");
                const data = await res.json();
                setProducts(data.products || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadProducts();
    }, []);

    const newProducts = products.slice(0, 4);

    return (
        <section className="ncs-section" id="featured">
            <div className="ncs-wrapper">

                <div className="ncs-header">
                    <div className="ncs-header-titles">
                        <Eyebrow className="ncs-eyebrow">Notre collection</Eyebrow>
                        <h2 className="ncs-title section-title">Nos meilleures ventes</h2>
                    </div>
                    <ButtonPrimary href="/#piece">
                        Voir tous les produits
                    </ButtonPrimary>
                </div>

                {loading ? (
                    <div className="ncs-grid">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="ncs-skeleton">
                                <div className="ncs-skeleton-img" />
                                <div className="ncs-skeleton-text" />
                                <div className="ncs-skeleton-text ncs-skeleton-text--short" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="ncs-grid">
                        {newProducts.map((product) => {
                            const secondaryImage = product.images?.[0] || null;
                            const hasSecondary = !!secondaryImage;
                            const isOutOfStock = product.stock === 0 || !product.isAvailable;

                            return (
                                <div className="ncs-card" key={product._id}>

                                    <div className="ncs-card-image-outer">
                                        <button
                                            className={`ncs-wishlist-btn ${isFavorite(product._id) ? "active" : ""}`}
                                            onClick={() => toggleFavorite(product)}
                                            aria-label="Ajouter aux favoris"
                                        >
                                            <svg viewBox="0 0 24 24" fill={isFavorite(product._id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" width="18" height="18">
                                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                            </svg>
                                        </button>

                                        {product.promoPrice && (
                                            <BadgePromo>
                                                -{Math.round(((product.price - product.promoPrice) / product.price) * 100)}%
                                            </BadgePromo>
                                        )}

                                        <Link href={`/products/${product._id}`} className="ncs-card-image-link">
                                            <div className={`ncs-card-image-wrap ${isOutOfStock ? "out-of-stock" : ""} ${hasSecondary ? "has-secondary" : ""}`}>
                                                <Image
                                                    src={product.image || "/no-image.png"}
                                                    alt={product.name}
                                                    width={400}
                                                    height={480}
                                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                                    className="ncs-card-img ncs-card-img-primary"
                                                />
                                                {hasSecondary && (
                                                    <Image
                                                        src={secondaryImage}
                                                        alt={product.name}
                                                        width={400}
                                                        height={480}
                                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                                        className="ncs-card-img ncs-card-img-secondary"
                                                    />
                                                )}
                                                {isOutOfStock && (
                                                    <div className="ncs-stock-overlay">Rupture de stock</div>
                                                )}
                                            </div>
                                        </Link>
                                    </div>

                                    <div className="ncs-card-info">
                                        <Link href={`/products/${product._id}`} className="ncs-card-name">
                                            {product.name}
                                        </Link>

                                        <div className="ncs-card-price">
                                            {product.promoPrice ? (
                                                <>
                                                    <span className="ncs-price-promo">{product.promoPrice.toLocaleString()} €</span>
                                                    <span className="ncs-price-old">{product.price.toLocaleString()} €</span>
                                                </>
                                            ) : (
                                                <span className="ncs-price-current">{product.price.toLocaleString()} €</span>
                                            )}
                                        </div>

                                        {product.colors?.length > 0 && (
                                            <div className="ncs-color-swatches">
                                                {product.colors.map((color, i) => (
                                                    <span
                                                        key={i}
                                                        className="ncs-color-swatch"
                                                        title={color.name}
                                                        style={{ background: color.code || "#ccc" }}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        <div className="ncs-card-bottom">
                                            <ButtonPrimary href={`/products/${product._id}`} size="sm">
                                                Voir le produit
                                            </ButtonPrimary>
                                        </div>
                                    </div>

                                </div>
                            );
                        })}

                        {/* Slide CTA — visible uniquement dans le carrousel mobile */}
                        <div className="ncs-card ncs-card-cta">
                            <div className="ncs-cta-body">
                                <p className="ncs-cta-text">Découvrez toute<br />notre collection</p>
                                <ButtonPrimary href="/#piece">
                                    Voir tous les produits
                                </ButtonPrimary>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </section>
    );
};

export default NotreCollectionSection;
