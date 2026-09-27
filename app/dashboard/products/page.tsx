"use client";

import { useEffect, useState } from "react";

export default function ProductsPage() {
  const [products, setProducts] = useState<Array<{ _id: string; name: string; price: number; promoPrice?: number | null }>>([]);

  useEffect(() => {
    fetch("/api/products")
      .then(res => res.json())
      // L'API renvoie { products, totalPages, currentPage }
      .then(data => setProducts(Array.isArray(data?.products) ? data.products : []))
      .catch(() => setProducts([]));
  }, []);

  return (
    <div>
      <h1>Produits</h1>

      {products.length === 0 && <p>Aucun produit</p>}

      <ul>
        {products.map((p) => (
          <li key={p._id}>
            {p.name} - {p.promoPrice ?? p.price} €
          </li>
        ))}
      </ul>
    </div>
  );
}
