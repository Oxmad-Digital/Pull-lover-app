"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { productPath } from "@/app/lib/seo";
import { useCart } from "@/app/components/CartContext";
import { ButtonPrimary, ButtonSecondary } from "@/app/components/ui/Button";
import { BadgePromo } from "@/app/components/ui/Tag";
import { useLang } from "@/app/i18n/I18nProvider";
import { INTL_LOCALE, localePath } from "@/app/i18n/config.mjs";
import { formatMoney } from "@/app/i18n/format.mjs";
import { localizeProduct } from "@/app/i18n/product.mjs";
import "./product-detail.css";

const TEXT = {
  fr: {
    view: (name, index) => `${name} — vue ${index}`,
    previous: "Image précédente",
    next: "Image suivante",
    reviewCount: (count) => `${count} avis`,
    details: "Détails du produit",
    brand: "Marque",
    condition: "État",
    noDetails: "Aucun détail disponible.",
    care: "Entretien et lavage",
    noInfo: "Aucune information disponible.",
    sizes: "Tailles",
    sizeError: "Veuillez sélectionner une taille avant d'ajouter au panier.",
    color: "Couleur",
    added: "Ajouté au panier ✓",
    addToCart: "Ajouter au panier",
    outOfStock: "Rupture de stock",
    reviews: "Avis clients",
    noReviews: "Aucun avis pour le moment. Soyez le premier !",
    thanks: "Merci pour votre avis !",
    writeReview: "Écrire un avis",
    yourName: "Votre nom",
    yourReview: "Votre avis",
    yourRating: "Votre note",
    stars: (star) => `${star} étoile${star > 1 ? "s" : ""}`,
    send: "Envoyer mon avis",
    seeLess: "Voir moins",
    seeMore: "Voir plus",
    related: "Produits similaires",
  },
  en: {
    view: (name, index) => `${name} — view ${index}`,
    previous: "Previous image",
    next: "Next image",
    reviewCount: (count) => `${count} review${count > 1 ? "s" : ""}`,
    details: "Product details",
    brand: "Brand",
    condition: "Condition",
    noDetails: "No details available.",
    care: "Care and washing",
    noInfo: "No information available.",
    sizes: "Sizes",
    sizeError: "Please select a size before adding to your cart.",
    color: "Colour",
    added: "Added to cart ✓",
    addToCart: "Add to cart",
    outOfStock: "Out of stock",
    reviews: "Customer reviews",
    noReviews: "No reviews yet. Be the first!",
    thanks: "Thank you for your review!",
    writeReview: "Write a review",
    yourName: "Your name",
    yourReview: "Your review",
    yourRating: "Your rating",
    stars: (star) => `${star} star${star > 1 ? "s" : ""}`,
    send: "Submit my review",
    seeLess: "See less",
    seeMore: "See more",
    related: "Similar products",
  },
};

// Partie interactive de la fiche : les données arrivent déjà rendues par page.jsx (serveur)
export default function ProductDetail({ product: baseProduct, initialReviews, relatedProducts }) {
  const lang = useLang();
  const t = TEXT[lang];
  const product = localizeProduct(baseProduct, lang);
  const { addToCart } = useCart();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [addedToCart, setAddedToCart] = useState(false);
  const [sizeError, setSizeError] = useState(false);

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
      name: baseProduct.name,
      translations: { en: { name: baseProduct.translations?.en?.name || "" } },
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

              {images.length > 1 && (
                <>
                  <button className="nav-arrow prev" aria-label={t.previous} onClick={() => setSelectedImage((i) => (i > 0 ? i - 1 : images.length - 1))}>‹</button>
                  <button className="nav-arrow next" aria-label={t.next} onClick={() => setSelectedImage((i) => (i < images.length - 1 ? i + 1 : 0))}>›</button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="thumbnails">
                {images.map((img, index) => (
                  <button key={index} className={`thumbnail ${selectedImage === index ? "active" : ""}`} onClick={() => setSelectedImage(index)}>
                    <Image src={img} alt={t.view(product.name, index + 1)} width={80} height={80} />
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
                <span className="reviews-count">({t.reviewCount(reviews.length)})</span>
              </div>
            )}

            {/* Prix */}
            <div className="product-price">
              {product.promoPrice ? (
                <>
                  <span className="current-price promo">{formatMoney(product.promoPrice, lang)}</span>
                  <span className="old-price">{formatMoney(product.price, lang)}</span>
                  <span className="discount-badge">-{getDiscount()}%</span>
                </>
              ) : (
                <span className="current-price">{formatMoney(product.price, lang)}</span>
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
                  <span>{t.details}</span>
                  <span className={`accordion-icon ${detailsOpen ? "open" : ""}`}>+</span>
                </button>
                {detailsOpen && (
                  <div className="accordion-body">
                    {product.details && <p>{product.details}</p>}
                    {(product.brand || product.condition || product.specifications?.length > 0) && (
                      <table className="specs-table">
                        <tbody>
                          {product.brand && <tr><td>{t.brand}</td><td>{product.brand}</td></tr>}
                          {product.condition && <tr><td>{t.condition}</td><td>{product.condition}</td></tr>}
                          {product.specifications?.map((spec, index) => (
                            <tr key={`${spec.label}-${index}`}><td>{spec.label}</td><td>{spec.value}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {!product.details && !product.brand && !product.condition && !product.specifications?.length && <p>{t.noDetails}</p>}
                  </div>
                )}
              </div>

              <div className="accordion-item">
                <button className="accordion-header" onClick={() => setCareOpen(!careOpen)}>
                  <span>{t.care}</span>
                  <span className={`accordion-icon ${careOpen ? "open" : ""}`}>+</span>
                </button>
                {careOpen && (
                  <div className="accordion-body">
                    <p>{product.careInstructions || t.noInfo}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tailles */}
            {productSizes.length > 0 && (
              <div className="option-group">
                <label>{t.sizes}</label>
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
                  <p className="size-error">{t.sizeError}</p>
                )}
              </div>
            )}

            {/* Couleurs */}
            {product.colors?.length > 0 && (
              <div className="option-group">
                <label>{t.color}{selectedColor ? ` : ${selectedColor}` : ""}</label>
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
                {addedToCart ? t.added : t.addToCart}
              </ButtonPrimary>
            ) : (
              <p className="out-of-stock-msg">{t.outOfStock}</p>
            )}

          </div>
        </div>

        {/* Section Avis */}
        <div className="reviews-section" data-reveal-stagger>
          <h2 className="reviews-title">{t.reviews}</h2>

          <div className="reviews-layout">

            {/* Colonne gauche — résumé + action */}
            <div className="reviews-left">
              {reviews.length > 0 ? (
                <div className="rating-summary">
                  <div className="average-score">
                    <span className="big-number">{averageRating.toFixed(1)}</span>
                    <div className="score-details">
                      <div className="stars">{renderStars(averageRating)}</div>
                      <span className="total-reviews">{t.reviewCount(reviews.length)}</span>
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
                <p className="no-reviews">{t.noReviews}</p>
              )}

              {reviewSuccess && <div className="review-success">{t.thanks}</div>}

              <ButtonSecondary onClick={() => setShowReviewForm(!showReviewForm)}>
                {t.writeReview}
              </ButtonSecondary>

              {showReviewForm && (
                <div className="review-form">
                  <input type="text" placeholder={t.yourName} aria-label={t.yourName} value={reviewName} onChange={(e) => setReviewName(e.target.value)} />
                  <textarea placeholder={t.yourReview} aria-label={t.yourReview} value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
                  <div className="star-selector" role="radiogroup" aria-label={t.yourRating}>
                    <span aria-hidden="true">{t.yourRating}{lang === "fr" ? " :" : ":"}</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        role="radio"
                        tabIndex={0}
                        aria-checked={star <= reviewRating}
                        aria-label={t.stars(star)}
                        className={`clickable-star ${star <= reviewRating ? "selected" : ""}`}
                        onClick={() => setReviewRating(star)}
                        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setReviewRating(star)}
                      >
                        {star <= reviewRating ? "★" : "☆"}
                      </span>
                    ))}
                  </div>
                  <ButtonPrimary onClick={submitReview}>{t.send}</ButtonPrimary>
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
                          {new Date(review.date).toLocaleDateString(INTL_LOCALE[lang], { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                      <p className="review-text">
                        {isLongComment && !isExpanded ? review.comment.substring(0, 150) + "..." : review.comment}
                      </p>
                      {isLongComment && (
                        <button className="see-more-btn" onClick={() => toggleExpandReview(review._id)}>
                          {isExpanded ? t.seeLess : t.seeMore}
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
            <h2 data-reveal>{t.related}</h2>
            <div className="related-grid" data-reveal-stagger>
              {relatedProducts.map((relatedProduct) => localizeProduct(relatedProduct, lang)).map((item) => (
                <Link key={item._id} href={localePath(lang, productPath(item))} className="related-card">
                  <div className="related-image">
                    <Image src={item.image || "/no-image.svg"} alt={item.name} width={200} height={200} />
                  </div>
                  <h3>{item.name}</h3>
                  <p className="related-price">{formatMoney(item.promoPrice || item.price, lang)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
