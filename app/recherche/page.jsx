"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import "./recherche.css";


function RechercheContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/search?q=${query}`);
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [query]);

  return (
    <div className="search-page">
      <h1 className="search-title" data-reveal>Résultats pour : "{query}"</h1>

      {loading && <p className="loading">Chargement...</p>}

      {!loading && products.length === 0 && (
        <div className="no-results">
          <h3>Aucun produit trouvé</h3>
        </div>
      )}

      <div className="products-grid" data-reveal-stagger>
        {products.map((product) => (
          <Link
            key={product._id}
            href={`/products/${product._id}`}
            className="product-card"
          >
            <img src={product.image} alt={product.name} className="product-image" />
            <div className="product-content">
              <h3 className="product-name">{product.name}</h3>
              <p className="product-price">{product.price} €</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function RecherchePage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px 0" }}>Chargement...</div>}>
      <RechercheContent />
    </Suspense>
  );
}
