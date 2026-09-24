"use client";

import { useEffect, useState } from "react";
import ProductForm from "@/app/components/ProductForm";
import { useToast } from "@/app/hooks/useToast";
import { useConfirmDialog } from "@/app/hooks/useConfirmDialog";
import { usePaginatedFetch } from "@/app/hooks/usePaginatedFetch";
import { Toast } from "@/app/components/ui/Toast";
import { ConfirmationDialog } from "@/app/components/ui/ConfirmationDialog";
import { ProductsFilters } from "./ProductsFilters";
import { ProductsTable } from "./ProductsTable";
import "./products-admin.css";

export default function ProductsManagement() {
  const [categories, setCategories]         = useState([]);
  const [stats, setStats]                   = useState(null);
  const [filter, setFilter]                 = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sort, setSort]                     = useState("createdAt");
  const [order]                             = useState("desc");
  const [search, setSearch]                 = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [exporting, setExporting]           = useState(false);
  const [showForm, setShowForm]             = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const { toast, showToast }                    = useToast();
  const { confirmModal, askConfirm, closeConfirm } = useConfirmDialog();

  useEffect(() => {
    fetch("/api/categories")
      .then(r => r.json())
      .then(d => setCategories(d.categories || d || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const queryParams = {
    filter, sort, order,
    ...(debouncedSearch  && { search: debouncedSearch }),
    ...(categoryFilter   && { category: categoryFilter }),
  };

  const { items: products, pagination, loading, error, page, setPage } =
    usePaginatedFetch("/api/admin/products", queryParams, {
      itemsKey: "products",
      onData:   (data) => setStats(data.stats ?? null),
    });

  // Mutations locales optimistes
  const [localProducts, setLocalProducts] = useState([]);
  useEffect(() => { setLocalProducts(products); }, [products]);

  const handleToggleAvailable = async (product) => {
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product._id, updates: { isAvailable: !product.isAvailable } }),
      });
      const data = await res.json();
      if (data.success) {
        setLocalProducts(prev =>
          prev.map(p => p._id === product._id ? { ...p, isAvailable: !p.isAvailable } : p)
        );
      } else {
        showToast("Erreur lors de la mise à jour", "error");
      }
    } catch {
      showToast("Erreur lors de la mise à jour", "error");
    }
  };

  const handleDelete = (productId, productName) => {
    askConfirm(`Supprimer "${productName}" définitivement ?`, async () => {
      try {
        const res  = await fetch(`/api/admin/products?id=${productId}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          setLocalProducts(prev => prev.filter(p => p._id !== productId));
          showToast("Produit supprimé");
        } else {
          showToast("Erreur lors de la suppression", "error");
        }
      } catch {
        showToast("Erreur lors de la suppression", "error");
      }
    });
  };

  const handleEdit  = (product) => { setEditingProduct(product); setShowForm(true); };
  const closeForm   = ()        => { setShowForm(false); setEditingProduct(null); };

  const handleSave = async (productData) => {
    try {
      const method = editingProduct ? "PUT" : "POST";
      const res    = await fetch("/api/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur serveur");
      const saved = data.product || data;
      setLocalProducts(prev => editingProduct
        ? prev.map(p => p._id === saved._id ? { ...p, ...saved } : p)
        : [saved, ...prev]);
      closeForm();
      showToast(editingProduct ? "Produit modifié" : "Produit ajouté");
    } catch (err) {
      showToast("Erreur : " + err.message, "error");
    }
  };

  const exportCSV = async () => {
    setExporting(true);
    try {
      const p = new URLSearchParams({ filter, sort, order, export: "true" });
      if (debouncedSearch) p.set("search", debouncedSearch);
      if (categoryFilter)  p.set("category", categoryFilter);

      const res  = await fetch(`/api/admin/products?${p}`);
      const data = await res.json();
      if (!data.success) return;

      const headers = [
        "Nom", "Marque", "Catégorie", "Prix (€)", "Prix promo (€)",
        "XS", "S", "M", "L", "XL", "Stock total", "Visible", "Ajouté le",
      ];
      const rows = data.products.map(p => [
        p.name, p.brand || "", p.category?.name || "",
        p.price, p.promoPrice || "",
        p.stocks?.XS ?? 0, p.stocks?.S ?? 0, p.stocks?.M ?? 0,
        p.stocks?.L ?? 0, p.stocks?.XL ?? 0,
        p.stock ?? 0,
        p.isAvailable !== false ? "Oui" : "Non",
        new Date(p.createdAt).toLocaleDateString("fr-FR"),
      ].join(";"));

      const csv  = [headers.join(";"), ...rows].join("\n");
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `produits_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="ap-page">

      <Toast toast={toast} />
      <ConfirmationDialog confirmModal={confirmModal} onClose={closeConfirm} />

      {/* Topbar */}
      <div className="ap-topbar">
        <h1 className="ap-topbar-title">Produit &amp; Stock</h1>
        <button className="ac-btn-export" onClick={exportCSV} disabled={exporting}>
          {exporting ? "Export…" : "Export CSV"}
        </button>
        {/* Mode mono-produit : on ne crée la fiche que si elle n'existe pas encore */}
        {!loading && localProducts.length === 0 && !debouncedSearch && !categoryFilter && filter === "all" && (
          <button className="ap-btn-add" onClick={() => { setEditingProduct(null); setShowForm(true); }}>
            Créer la fiche Mantasoa
          </button>
        )}
      </div>

      <ProductsFilters
        search={search}         onSearchChange={setSearch}
        filter={filter}         onFilterChange={setFilter}
        categoryFilter={categoryFilter} onCategoryChange={setCategoryFilter}
        sort={sort}             onSortChange={setSort}
        categories={categories}
        stats={stats}
      />

      <ProductsTable
        products={localProducts}
        loading={loading}
        error={error}
        onRetry={() => setPage(p => p)}
        pagination={pagination}
        page={page}
        onPageChange={setPage}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggle={handleToggleAvailable}
      />

      {/* Modal formulaire */}
      {showForm && (
        <div
          className="ap-modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) closeForm(); }}
        >
          <div className="ap-modal">
            <div className="ap-modal-header">
              <h2 className="ap-modal-title">
                {editingProduct ? "Modifier la fiche produit" : "Créer la fiche Mantasoa"}
              </h2>
              <button className="ap-modal-close" onClick={closeForm}>✕</button>
            </div>
            <div className="ap-modal-body">
              <ProductForm
                categories={categories}
                editingProduct={editingProduct}
                onSave={handleSave}
                onCancel={closeForm}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
