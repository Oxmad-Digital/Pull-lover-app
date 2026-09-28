"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { productPath } from "@/app/lib/seo";
import { useCart } from "@/app/components/CartContext";
import { useFavorites } from "@/app/components/FavoritesContext";
import { ButtonPrimary, ButtonSecondary } from "@/app/components/ui/Button";
import { BadgePromo } from "@/app/components/ui/Tag";
import "./product-detail.css";

// Partie interactive de la fiche : les données arrivent déjà rendues par page.jsx (serveur)
export default function ProductDetail({ product, initialReviews, relatedProducts }) {
  const { addToCart } = useCart();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [addedToCart, setAddedToCart] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const { toggleFavorite, isFavorite } = useFavorites();

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [careOpen, setCareOpen] = useState(false);

  const [reviews, setReviews] = useState(initialReviews);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewName, setReviewName] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState({});
  const productId = product._id;

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => distribution[r.rating]++);
    return distribution;
  };

  const toggleExpandReview = (reviewId) => {
    setExpandedReviews((prev) => ({ ...prev, [reviewId]: !prev[reviewId] }));
  };

  const submitReview = async () => {
    if (!productId || !reviewName || !reviewComment) return;
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, name: reviewName, rating: reviewRating, comment: reviewComment }),
    });
    const created = res.ok ? await res.json() : null;
    setReviewName("");
    setReviewComment("");
    setReviewRating(5);
    setShowReviewForm(false);
    setReviewSuccess(true);
    setTimeout(() => setReviewSuccess(false), 3000);
    // L'avis créé est ajouté en tête (tri par date décroissante) au lieu de relire la liste
    if (created?._id) setReviews((prev) => [created, ...prev]);
  };

  const getAllImages = () => {
    const allImages = [];
    if (product.image) allImages.push(product.image);
    if (product.images?.length) allImages.push(...product.images);
    const unique = [...new Set(allImages)].filter(Boolean);
    return unique.length > 0 ? unique : ["/no-image.svg"];
  };

  const handleAddToCart = () => {
    if (productSizes.length > 0 && !selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 3000);
      return;
    }
    addToCart({
      _id: product._id,
      name: product.name,
      price: product.price,
      promoPrice: product.promoPrice || null,
      image: product.image,
      quantity: 1,
      size: selectedSize,
      color: selectedColor,
      stock: product.stock,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const getDiscount = () => {
    if (!product?.promoPrice || !product?.price) return 0;
    return Math.round((1 - product.promoPrice / product.price) * 100);
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) {
        stars.push(<span key={i} className="star filled">★</span>);
      } else if (i - 0.5 <= rating) {
        stars.push(<span key={i} className="star half">★</span>);
      } else {
        stars.push(<span key={i} className="star empty">☆</span>);
      }
    }
    return stars;
  };

  const images = getAllImages();
  const productSizes =
    product.sizes?.length > 0
      ? product.sizes
      : product.size
        ? [product.size]
        : [];

  return (
    <div className="product-page-bg">
      <div className="product-detail-page">

        {/* Section principale */}
        <div className="product-main">

          {/* Galerie */}
          <div className="product-gallery" data-reveal>
            <div className="main-image">
              <Image
                src={images[selectedImage]}
                alt={product.name}
                width={600}
                height={700}
                priority
                className="zoom-image"
              />

              {product.promoPrice && (
                <BadgePromo>-{getDiscount()}%</BadgePromo>
              )}

              <button
                className={`wishlist-btn ${product && isFavorite(product._id) ? "active" : ""}`}
                onClick={() => product && toggleFavorite(product)}
                aria-label="Ajouter aux favoris"
              >
                <svg viewBox="0 0 24 24" fill={product && isFavorite(product._id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" width="18" height="18">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>

              {images.length > 1 && (
                <>
                  <button className="nav-arrow prev" aria-label="Image précédente" onClick={() => setSelectedImage((i) => (i > 0 ? i - 1 : images.length - 1))}>‹</button>
                  <button className="nav-arrow next" aria-label="Image suivante" onClick={() => setSelectedImage((i) => (i < images.length - 1 ? i + 1 : 0))}>›</button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="thumbnails">
                {images.map((img, index) => (
                  <button key={index} className={`thumbnail ${selectedImage === index ? "active" : ""}`} onClick={() => setSelectedImage(index)}>
                    <Image src={img} alt={`${product.name} — vue ${index + 1}`} width={80} height={80} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Informations produit */}
          <div className="product-info" data-reveal-stagger>

            <h1 className="product-name">{product.name}</h1>

            {/* Étoiles */}
            {reviews.length > 0 && (
              <div className="product-rating">
                <div className="stars">{renderStars(averageRating)}</div>
                <span className="reviews-count">({reviews.length} avis)</span>
              </div>
            )}

            {/* Prix */}
            <div className="product-price">
              {product.promoPrice ? (
                <>
                  <span className="current-price promo">{Number(product.promoPrice).toLocaleString()} €</span>
                  <span className="old-price">{Number(product.price).toLocaleString()} €</span>
                  <span className="discount-badge">-{getDiscount()}%</span>
                </>
              ) : (
                <span className="current-price">{Number(product.price).toLocaleString()} €</span>
              )}
            </div>

            {/* Description courte */}
            {product.description && (
              <p className="product-description">{product.description}</p>
            )}

            {/* Accordéons */}
            <div className="accordions">
              <div className="accordion-item">
                <button className="accordion-header" onClick={() => setDetailsOpen(!detailsOpen)}>
                  <span>Détails du produit</span>
                  <span className={`accordion-icon ${detailsOpen ? "open" : ""}`}>+</span>
                </button>
                {detailsOpen && (
                  <div className="accordion-body">
                    {product.details && <p>{product.details}</p>}
                    {(product.brand || product.condition || product.specifications?.length > 0) && (
                      <table className="specs-table">
                        <tbody>
                          {product.brand && <tr><td>Marque</td><td>{product.brand}</td></tr>}
                          {product.condition && <tr><td>État</td><td>{product.condition}</td></tr>}
                          {product.specifications?.map((spec, index) => (
                            <tr key={`${spec.label}-${index}`}><td>{spec.label}</td><td>{spec.value}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {!product.details && !product.brand && !product.condition && !product.specifications?.length && <p>Aucun détail disponible.</p>}
                  </div>
                )}
              </div>

              <div className="accordion-item">
                <button className="accordion-header" onClick={() => setCareOpen(!careOpen)}>
                  <span>Entretien et lavage</span>
                  <span className={`accordion-icon ${careOpen ? "open" : ""}`}>+</span>
                </button>
                {careOpen && (
                  <div className="accordion-body">
                    <p>{product.careInstructions || "Aucune information disponible."}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tailles */}
            {productSizes.length > 0 && (
              <div className="option-group">
                <label>Tailles</label>
                <div className="size-options">
                  {productSizes.map((size) => (
                    <button
                      key={size}
                      className={`size-btn ${selectedSize === size ? "active" : ""}`}
                      onClick={() => { setSelectedSize(size); setSizeError(false); }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {sizeError && (
                  <p className="size-error">Veuillez sélectionner une taille avant d&apos;ajouter au panier.</p>
                )}
              </div>
            )}

            {/* Couleurs */}
            {product.colors?.length > 0 && (
              <div className="option-group">
                <label>Couleur{selectedColor ? ` : ${selectedColor}` : ""}</label>
                <div className="color-options">
                  {product.colors.map((color) => (
                    <button
                      key={color.code}
                      className={`color-btn ${selectedColor === color.name ? "active" : ""}`}
                      style={{ backgroundColor: color.code }}
                      onClick={() => setSelectedColor(color.name)}
                      aria-label={color.name}
                      aria-pressed={selectedColor === color.name}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Ajouter au panier */}
            {product.stock > 0 ? (
              <ButtonPrimary
                full
                onClick={handleAddToCart}
                className={addedToCart ? "added" : ""}
              >
                {addedToCart ? "Ajouté au panier ✓" : "Ajouter au panier"}
              </ButtonPrimary>
            ) : (
              <p className="out-of-stock-msg">Rupture de stock</p>
            )}

          </div>
        </div>

        {/* Section Avis */}
        <div className="reviews-section" data-reveal-stagger>
          <h2 className="reviews-title">Avis clients</h2>

          <div className="reviews-layout">

            {/* Colonne gauche — résumé + action */}
            <div className="reviews-left">
              {reviews.length > 0 ? (
                <div className="rating-summary">
                  <div className="average-score">
                    <span className="big-number">{averageRating.toFixed(1)}</span>
                    <div className="score-details">
                      <div className="stars">{renderStars(averageRating)}</div>
                      <span className="total-reviews">{reviews.length} avis</span>
                    </div>
                  </div>
                  <div className="rating-bars">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = getRatingDistribution()[star];
                      const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      return (
                        <div key={star} className="rating-bar">
                          <span className="star-label">{star}★</span>
                          <div className="bar-bg">
                            <div className="bar-fill" style={{ width: `${percent}%` }}></div>
                          </div>
                          <span className="bar-count">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="no-reviews">Aucun avis pour le moment. Soyez le premier !</p>
              )}

              {reviewSuccess && <div className="review-success">Merci pour votre avis !</div>}

              <ButtonSecondary onClick={() => setShowReviewForm(!showReviewForm)}>
                Écrire un avis
              </ButtonSecondary>

              {showReviewForm && (
                <div className="review-form">
                  <input type="text" placeholder="Votre nom" aria-label="Votre nom" value={reviewName} onChange={(e) => setReviewName(e.target.value)} />
                  <textarea placeholder="Votre avis" aria-label="Votre avis" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
                  <div className="star-selector" role="radiogroup" aria-label="Votre note">
                    <span aria-hidden="true">Votre note :</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        role="radio"
                        tabIndex={0}
                        aria-checked={star <= reviewRating}
                        aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
                        className={`clickable-star ${star <= reviewRating ? "selected" : ""}`}
                        onClick={() => setReviewRating(star)}
                        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setReviewRating(star)}
                      >
                        {star <= reviewRating ? "★" : "☆"}
                      </span>
                    ))}
                  </div>
                  <ButtonPrimary onClick={submitReview}>Envoyer mon avis</ButtonPrimary>
                </div>
              )}
            </div>

            {/* Colonne droite — liste des avis */}
            <div className="reviews-right">
              <div className="reviews-list-compact">
                {reviews.map((review) => {
                  const isExpanded = expandedReviews[review._id];
                  const isLongComment = review.comment.length > 150;
                  return (
                    <div key={review._id} className="review-card">
                      <div className="review-meta">
                        <span className="review-stars-inline">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
                        <span className="review-author">{review.name}</span>
                        <span className="review-separator">·</span>
                        <span className="review-date-inline">
                          {new Date(review.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                      <p className="review-text">
                        {isLongComment && !isExpanded ? review.comment.substring(0, 150) + "..." : review.comment}
                      </p>
                      {isLongComment && (
                        <button className="see-more-btn" onClick={() => toggleExpandReview(review._id)}>
                          {isExpanded ? "Voir moins" : "Voir plus"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Produits similaires */}
        {relatedProducts.length > 0 && (
          <div className="related-products">
            <h2 data-reveal>Produits similaires</h2>
            <div className="related-grid" data-reveal-stagger>
              {relatedProducts.map((item) => (
                <Link key={item._id} href={productPath(item)} className="related-card">
                  <div className="related-image">
                    <Image src={item.image || "/no-image.svg"} alt={item.name} width={200} height={200} />
                  </div>
                  <h3>{item.name}</h3>
                  <p className="related-price">{Number(item.promoPrice || item.price).toLocaleString()} €</p>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
