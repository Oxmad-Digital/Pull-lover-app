"use client";

import { useRef } from "react";
import { useClickOutside } from "@/app/hooks/useClickOutside";
import { useState } from "react";

const CHIP_FILTERS = [
  { value: "all", label: "Tous",         statsKey: "total",      color: "#252323" },
  { value: "low", label: "Stock faible", statsKey: "lowStock",   color: "#b45309" },
  { value: "out", label: "Rupture",      statsKey: "outOfStock", color: "#be123c" },
];

const SORT_OPTIONS = [
  { label: "Date création", value: "createdAt" },
  { label: "Nom",           value: "name"      },
  { label: "Prix",          value: "price"     },
  { label: "Stock",         value: "stock"     },
];

const ChevronIcon = ({ open }) => (
  <svg className={`ap-sort-trigger-arrow ${open ? "open" : ""}`} width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M1.5 3.5L5 7L8.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export function ProductsFilters({
  search, onSearchChange,
  filter, onFilterChange,
  sort, onSortChange,
  stats,
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen,   setSortOpen]   = useState(false);
  const filterRef = useRef(null);
  const sortRef   = useRef(null);

  useClickOutside([
    [filterRef, () => setFilterOpen(false)],
    [sortRef,   () => setSortOpen(false)],
  ]);

  return (
    <div className="ao-toolbar-top">
      <input
        type="text"
        placeholder="Rechercher un produit…"
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        className="ap-search-input"
      />

      {/* Filtre stock */}
      <div className="ap-sort-wrap" ref={filterRef}>
        <button className="ap-sort-trigger" onClick={() => setFilterOpen(o => !o)}>
          <span className="ao-filter-dot" style={{ background: CHIP_FILTERS.find(f => f.value === filter)?.color }} />
          {CHIP_FILTERS.find(f => f.value === filter)?.label}
          <ChevronIcon open={filterOpen} />
        </button>
        {filterOpen && (
          <ul className="ap-sort-dropdown">
            <li className="ap-sort-dropdown-title">Filtrer par stock</li>
            {CHIP_FILTERS.map(f => {
              const count = stats ? stats[f.statsKey] : null;
              return (
                <li
                  key={f.value}
                  className={`ap-sort-option ${filter === f.value ? "selected" : ""}`}
                  onClick={() => { onFilterChange(f.value); setFilterOpen(false); }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="ao-filter-dot" style={{ background: f.color }} />
                    {f.label}
                    {count !== null && <span style={{ color: "#a8a29e", fontSize: "11px" }}>({count})</span>}
                  </span>
                  {filter === f.value && <span className="ap-sort-check">✓</span>}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Tri */}
      <div className="ap-sort-wrap" ref={sortRef}>
        <button className="ap-sort-trigger" onClick={() => setSortOpen(o => !o)}>
          {SORT_OPTIONS.find(o => o.value === sort)?.label}
          <ChevronIcon open={sortOpen} />
        </button>
        {sortOpen && (
          <ul className="ap-sort-dropdown">
            <li className="ap-sort-dropdown-title">Trier par</li>
            {SORT_OPTIONS.map(o => (
              <li
                key={o.value}
                className={`ap-sort-option ${sort === o.value ? "selected" : ""}`}
                onClick={() => { onSortChange(o.value); setSortOpen(false); }}
              >
                {o.label}
                {sort === o.value && <span className="ap-sort-check">✓</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
