"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useClickOutside } from "@/app/hooks/useClickOutside";
import { useFavorites } from "../components/FavoritesContext";
import { ButtonPrimary, ButtonGhost } from "../components/ui/Button";
import { BadgePromo } from "../components/ui/Tag";
import "../components/NotreCollectionSection.css";
import "./nos-mailles.css";

const GENDER_FILTERS = ["Homme", "Femme", "Accessoires"];
const PRODUCTS_PER_PAGE = 6;

function NosMaillesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState(search);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  const { toggleFavorite, isFavorite } = useFavorites();

  useClickOutside([[filterRef, () => setFilterOpen(false)]]);

  const updateURL = (params) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(params).forEach(([key, value]) => {
      if (value) newParams.set(key, value);
      else newParams.delete(key);
    });
    router.push(`/nos-mailles?${newParams.toString()}`);
  };

  // Debounce recherche → URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        updateURL({ search: searchInput });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Catégories (une seule fois)
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  // Fetch page 1 quand les filtres changent
  useEffect(() => {
    async function fetchFirst() {
      try {
        setLoading(true);
        setError("");
        setProducts([]);
        setPage(1);
        const query = new URLSearchParams({
          limit: String(PRODUCTS_PER_PAGE),
          page: "1",
        });
        if (search) query.set("search", search);
        if (category) query.set("category", category);
        const res = await fetch(`/api/products?${query.toString()}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setProducts(data.products || []);
        setTotalPages(data.totalPages || 1);
      } catch {
        setError("Impossible de charger les produits");
      } finally {
        setLoading(false);
      }
    }
    fetchFirst();
  }, [search, category]);

  async function loadMore() {
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const query = new URLSearchParams({
        limit: String(PRODUCTS_PER_PAGE),
        page: String(nextPage),
      });
      if (search) query.set("search", search);
      if (category) query.set("category", category);
      const res = await fetch(`/api/products?${query.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      setProducts((prev) => [...prev, ...(data.products || [])]);
      setPage(nextPage);
    } finally {
      setLoadingMore(false);
    }
  }

  const resetFilters = () => {
    setSearchInput("");
    router.push("/nos-mailles");
  };

  return (
    <div className="boutique-container">

      {/* EN-TETE */}
      <div className="boutique-header" data-reveal-stagger>
        <h1 className="boutique-title">Nos Mailles</h1>
        <p className="boutique-tagline">Des mailles pensées pour durer</p>
      </div>

      {/* BARRE FILTRES */}
      <div className="filters-bar" data-reveal>
        <div className="search-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher..."
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
                  updateURL({ category: isActive ? "" : cat._id });
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Dropdown mobile */}
        <div className="filter-dropdown" ref={filterRef}>
          <button
            className={`filter-dropdown-btn${GENDER_FILTERS.some((label) => {
              const cat = categories.find((c) => c.name.toLowerCase() === label.toLowerCase());
              return cat && category === cat._id;
            }) ? " active" : ""}`}
            onClick={() => setFilterOpen((o) => !o)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
            {GENDER_FILTERS.find((label) => {
              const cat = categories.find((c) => c.name.toLowerCase() === label.toLowerCase());
              return cat && category === cat._id;
            }) || "Filtres"}
            <svg className={`filter-chevron${filterOpen ? " open" : ""}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {filterOpen && (
            <div className="filter-dropdown-panel">
              {GENDER_FILTERS.map((label) => {
                const cat = categories.find((c) => c.name.toLowerCase() === label.toLowerCase());
                const isActive = cat ? category === cat._id : false;
                return (
                  <button
                    key={label}
                    className={`filter-dropdown-option${isActive ? " active" : ""}`}
                    onClick={() => {
                      if (!cat) return;
                      updateURL({ category: isActive ? "" : cat._id });
                      setFilterOpen(false);
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* SKELETON */}
      {loading && (
        <div className="products-grid">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="ncs-skeleton">
              <div className="ncs-skeleton-img" />
              <div className="ncs-skeleton-text" />
              <div className="ncs-skeleton-text ncs-skeleton-text--short" />
            </div>
          ))}
        </div>
      )}

      {error && <div className="error-state">❌ {error}</div>}

      {!loading && products.length === 0 && !error && (
        <div className="empty-state" data-reveal>
          <p>Aucun produit trouvé</p>
          <button className="reset-btn" onClick={resetFilters}>Réinitialiser</button>
        </div>
      )}

      {/* GRILLE PRODUITS */}
      {!loading && products.length > 0 && (
        <div className="products-grid" data-reveal-stagger>
          {products.map((product) => {
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
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="ncs-card-img ncs-card-img-primary"
                      />
                      {hasSecondary && (
                        <Image
                          src={secondaryImage}
                          alt={product.name}
                          width={400}
                          height={480}
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
        </div>
      )}

      {/* VOIR PLUS */}
      {!loading && page < totalPages && (
        <div className="pagination" data-reveal>
          <ButtonGhost onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Chargement..." : "Voir plus"}
          </ButtonGhost>
        </div>
      )}

    </div>
  );
}

function NosMaillesSkeleton() {
  return (
    <div className="boutique-container">
      <div className="products-grid">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="ncs-skeleton">
            <div className="ncs-skeleton-img" />
            <div className="ncs-skeleton-text" />
            <div className="ncs-skeleton-text ncs-skeleton-text--short" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NosMaillesPage() {
  return (
    <Suspense fallback={<NosMaillesSkeleton />}>
      <NosMaillesContent />
    </Suspense>
  );
}
