"use client";

import Link from "next/link";
import Image from "next/image";
import { AdminDataTable } from "@/app/components/admin/AdminDataTable";

const ALL_SIZES = ["XS", "S", "M", "L", "XL"];

function StockBySize({ stocks }) {
  const stockMap = stocks || {};
  return (
    <div className="ap-stocks-by-size">
      {ALL_SIZES.map(size => {
        const qty = stockMap[size] ?? 0;
        return (
          <span key={size} className={`ap-size-chip ${qty === 0 ? "empty" : ""}`}>
            <span className="ap-size-label">{size}</span>
            <span className="ap-size-qty">{qty}</span>
          </span>
        );
      })}
    </div>
  );
}

function StockBadge({ stock }) {
  if (stock === 0) return <span className="ap-badge ap-badge-out">Rupture</span>;
  if (stock < 5)   return <span className="ap-badge ap-badge-low">Stock faible</span>;
  return <span className="ap-badge ap-badge-ok">Disponible</span>;
}

function CreatedAt({ date }) {
  if (!date) return <span style={{ color: "#a8a29e" }}>—</span>;
  const d = new Date(date);
  return <span className="ap-date">{d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</span>;
}

const COLUMNS = (onEdit, onDelete, onToggle) => [
  {
    key: "product",
    label: "Produit",
    render: (p) => (
      <div className="ap-product-cell">
        {p.image
          ? <Image src={p.image} alt={p.name || ""} width={40} height={40} className="ap-product-img" />
          : <div className="ap-product-no-img">👕</div>
        }
        <div>
          <span className="ap-product-name">{p.name}</span>
          {p.brand && <span className="ap-product-brand">{p.brand}</span>}
        </div>
      </div>
    ),
  },
  {
    key: "price",
    label: "Prix",
    render: (p) => p.promoPrice ? (
      <>
        <span className="ap-price-original">{p.price.toLocaleString()} €</span>
        <span className="ap-price-promo">{p.promoPrice.toLocaleString()} €</span>
      </>
    ) : (
      <span className="ap-price">{p.price.toLocaleString()} €</span>
    ),
  },
  {
    key: "stocks",
    label: "Stock par taille",
    render: (p) => <StockBySize stocks={p.stocks} />,
  },
  {
    key: "stock",
    label: "Statut",
    render: (p) => <StockBadge stock={p.stock} />,
  },
  {
    key: "isAvailable",
    label: "Visible",
    render: (p) => (
      <button
        className={`ap-toggle ${p.isAvailable !== false ? "on" : "off"}`}
        onClick={() => onToggle(p)}
        title={p.isAvailable !== false ? "Visible — cliquer pour masquer" : "Masqué — cliquer pour afficher"}
      >
        <span className="ap-toggle-thumb" />
      </button>
    ),
  },
  {
    key: "createdAt",
    label: "Ajouté le",
    render: (p) => <CreatedAt date={p.createdAt} />,
  },
  {
    key: "actions",
    label: "Actions",
    render: (p) => (
      <div className="ap-actions">
        <Link href={`/products/${p._id}`} target="_blank" className="ap-btn-view" title="Voir la fiche produit">↗</Link>
        <button className="ap-btn-edit" onClick={() => onEdit(p)}>Modifier</button>
        <button className="ap-btn-delete" onClick={() => onDelete(p._id, p.name)}>Supprimer</button>
      </div>
    ),
  },
];

export function ProductsTable({
  products,
  loading,
  error,
  onRetry,
  pagination,
  page,
  onPageChange,
  onEdit,
  onDelete,
  onToggle,
}) {
  return (
    <AdminDataTable
      columns={COLUMNS(onEdit, onDelete, onToggle)}
      data={products}
      loading={loading}
      emptyMessage="Aucun produit trouvé"
      error={error}
      onRetry={onRetry}
      pagination={pagination}
      page={page}
      onPageChange={onPageChange}
    />
  );
}
