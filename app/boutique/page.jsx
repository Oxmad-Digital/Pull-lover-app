"use client";

import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useCart } from "../components/CartContext";
import { useFavorites } from "../components/FavoritesContext";
import { ButtonPrimary, ButtonGhost } from "../components/ui/Button";
import { BadgePromo } from "../components/ui/Tag";
import "./boutique.css";

const GENDER_FILTERS = ["Homme", "Femme", "Accessoires"];

function BoutiqueContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState(search);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 9;

  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();


  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        updateURL({ search: searchInput, page: 1 });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError("");
        const query = new URLSearchParams();
        if (search) query.append("search", search);
        if (category) query.append("category", category);
        if (sort) query.append("sort", sort);
        const res = await fetch(`/api/products?${query.toString()}`);
        if (!res.ok) throw new Error("Erreur chargement produits");
        const data = await res.json();
        setProducts(data.products || []);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les produits");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
    setCurrentPage(1);
  }, [search, category, sort]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) return;
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erreur chargement catégories");
      }
    }
    fetchCategories();
  }, []);

  const filteredProducts = products.filter((product) => {
    if (priceMin && product.price < parseFloat(priceMin)) return false;
    if (priceMax && product.price > parseFloat(priceMax)) return false;
    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sort) {
      case "price-asc": return (a.promoPrice || a.price) - (b.promoPrice || b.price);
      case "price-desc": return (b.promoPrice || b.price) - (a.promoPrice || a.price);
      case "name-asc": return a.name.localeCompare(b.name);
      case "name-desc": return b.name.localeCompare(a.name);
      case "newest": return new Date(b.createdAt) - new Date(a.createdAt);
      default: return 0;
    }
  });

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = sortedProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);

  const updateURL = (params) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(params).forEach(([key, value]) => {
      if (value) newParams.set(key, value);
      else newParams.delete(key);
    });
    router.push(`/boutique?${newParams.toString()}`);
  };

  const resetFilters = () => {
    setPriceMin("");
    setPriceMax("");
    setSearchInput("");
    router.push("/boutique");
  };

  return (
    <div className="boutique-container">

      {/* BARRE FILTRES */}
      <div className="filters-bar" data-reveal>
        <div className="search-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher..."
            aria-label="Rechercher un produit"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters-right">
          {GENDER_FILTERS.map((label) => {
            const cat = categories.find(
              (c) => c.name.toLowerCase() === label.toLowerCase()
            );
            const isActive = cat ? category === cat._id : false;
            return (
              <button
                key={label}
                className={`gender-btn${isActive ? " active" : ""}`}
                onClick={() => {
                  if (!cat) return;
                  updateURL({ category: isActive ? "" : cat._id, page: 1 });
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* SKELETON */}
      {loading && (
        <div className="products-grid">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-image" />
              <div className="skeleton-line" />
              <div className="skeleton-line short" />
            </div>
          ))}
        </div>
      )}

      {error && <div className="error-state">❌ {error}</div>}

      {!loading && sortedProducts.length === 0 && (
        <div className="empty-state" data-reveal>
          <p>Aucun produit trouvé</p>
          <button className="reset-btn" onClick={resetFilters}>Réinitialiser</button>
        </div>
      )}

      {/* GRILLE PRODUITS */}
      {!loading && currentProducts.length > 0 && (
        <div className="products-grid" data-reveal-stagger>
          {currentProducts.map((product) => {
            // Compte le nombre de couleurs disponibles si le champ existe
            const colorCount = product.colors?.length ?? null;

            return (
              <div className="product-card" key={product._id}>

                {/* IMAGE + BADGES + WISHLIST — tous dans le même bloc relatif */}
                <div className="product-image-outer">
                  {/* WISHLIST */}
                  <button
                    className={`wishlist-btn ${isFavorite(product._id) ? "active" : ""}`}
                    onClick={() => toggleFavorite(product)}
                    aria-label="Ajouter aux favoris"
                  >
                    <svg viewBox="0 0 24 24" fill={isFavorite(product._id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" width="18" height="18">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>

                  {/* Badge promo — haut gauche */}
                  {product.promoPrice && (
                    <BadgePromo>
                      -{Math.round(((product.price - product.promoPrice) / product.price) * 100)}%
                    </BadgePromo>
                  )}

                  {/* IMAGE */}
                  <Link href={`/products/${product._id}`} className="product-image-link">
                    <div className={`product-image-wrap ${product.stock === 0 ? "out-of-stock" : ""}`}>
                      <Image
                        src={product.image || "/no-image.png"}
                        alt={product.name}
                        width={400}
                        height={480}
                        className="product-img"
                      />
                      {product.stock === 0 && (
                        <div className="stock-overlay" aria-hidden="true">Rupture de stock</div>
                      )}
                    </div>
                  </Link>


                </div>

                {/* INFOS — centrées comme dans la maquette */}
                <div className="product-info">
                  <Link href={`/products/${product._id}`} className="product-name">
                    {product.name}
                  </Link>

                  <div className="product-price">
                    {product.promoPrice ? (
                      <>
                        <span className="price-promo">{product.promoPrice.toLocaleString()} €</span>
                        <span className="price-old">{product.price.toLocaleString()} €</span>
                      </>
                    ) : (
                      <span className="price-normal">{product.price.toLocaleString()} €</span>
                    )}
                  </div>

                  {/* Couleurs disponibles — seulement si le champ existe et > 0 */}
                  {colorCount !== null && colorCount > 0 && (
                    <p className="product-colors">
                      {colorCount} couleur{colorCount > 1 ? "s" : ""}
                    </p>
                  )}

                  {/* Bouton panier — apparaît au hover */}
                  <div className="product-bottom">
                    <ButtonPrimary
                      full
                      disabled={!product.isAvailable || product.stock === 0}
                      onClick={() =>
                        addToCart({
                          _id: product._id,
                          name: product.name,
                          price: product.promoPrice ?? product.price,
                          image: product.image,
                          quantity: 1,
                          stock: product.stock,
                        })
                      }
                    >
                      Ajouter au panier
                    </ButtonPrimary>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* VOIR PLUS / PAGINATION */}
      {!loading && totalPages > 1 && (
        <div className="pagination" data-reveal>
          {currentPage < totalPages && (
            <ButtonGhost
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Voir plus
            </ButtonGhost>
          )}
          <p className="pagination-info">
            {Math.min(indexOfLastProduct, sortedProducts.length)} / {sortedProducts.length} produits
          </p>
        </div>
      )}
    </div>
  );
}

function BoutiqueSkeleton() {
  return (
    <div className="boutique-container">
      <div className="products-grid">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-image" />
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BoutiquePage() {
  return (
    <Suspense fallback={<BoutiqueSkeleton />}>
      <BoutiqueContent />
    </Suspense>
  );
}