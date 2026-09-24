"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  DashboardIcon, ProductsIcon, CategoriesIcon, UsersIcon, AdminOrdersIcon,
  NewsletterIcon, PromoIcon, LogoutIcon, PlusIcon, CloseIcon, SettingsIcon,
} from "@/app/components/icons";

const NAV_ITEMS = [
  { href: "/admin/dashboard",  label: "Dashboard",      short: "Dashboard",  icon: <DashboardIcon /> },
  { href: "/admin/products",   label: "Produits & Stock", short: "Produits",  icon: <ProductsIcon /> },
  { href: "/admin/categories", label: "Catégories",     short: "Catégories", icon: <CategoriesIcon /> },
  { href: "/admin/customers",  label: "Utilisateurs",   short: "Users",      icon: <UsersIcon /> },
  { href: "/admin/orders",     label: "Commandes",      short: "Commandes",  icon: <AdminOrdersIcon /> },
  { href: "/admin/newsletter", label: "Newsletter",     short: "News",       icon: <NewsletterIcon /> },
  { href: "/admin/promos",    label: "Codes promo",    short: "Promos",     icon: <PromoIcon /> },
  { href: "/admin/settings", label: "Gestion du contenu", short: "Contenu",  icon: <SettingsIcon /> },
];

const BOTTOM_PRIMARY = ["/admin/dashboard", "/admin/products", "/admin/orders"];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href) =>
    href === "/admin/dashboard" ? pathname === href : pathname.startsWith(href);

  const primaryItems = NAV_ITEMS.filter((i) => BOTTOM_PRIMARY.includes(i.href));
  const secondaryItems = NAV_ITEMS.filter((i) => !BOTTOM_PRIMARY.includes(i.href));

  return (
    <>
      {/* Sidebar desktop / tablette */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <Link href="/" className="admin-sidebar-brand" aria-label="Accueil Pull Lover">
            <span className="admin-sidebar-wordmark" aria-hidden="true">
              <span className="admin-sidebar-wordmark-pull">Pull</span>
              <span className="admin-sidebar-wordmark-lover">Lover</span>
            </span>
            <span className="admin-sidebar-brand-origin">Maille de Madagascar</span>
          </Link>
          <div className="admin-sidebar-info">
            <span>Administration</span>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          {NAV_ITEMS.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`admin-nav-item${isActive(href) ? " active" : ""}`}
            >
              <span className="admin-nav-icon">{icon}</span>
              <span className="admin-nav-label">{label}</span>
            </Link>
          ))}

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="admin-nav-item admin-nav-logout"
          >
            <span className="admin-nav-icon"><LogoutIcon /></span>
            <span className="admin-nav-label">Déconnexion</span>
          </button>
        </nav>
      </aside>

      {/* Bottom nav mobile — 3 items fixes + bouton Plus */}
      <nav className="admin-bottom-nav">
        {primaryItems.map(({ href, short, icon }) => (
          <Link
            key={href}
            href={href}
            className={`admin-bottom-nav-item${isActive(href) ? " active" : ""}`}
          >
            <span className="admin-bottom-nav-icon">{icon}</span>
            <span>{short}</span>
          </Link>
        ))}
        <button
          className={`admin-bottom-nav-item${moreOpen ? " active" : ""}`}
          onClick={() => setMoreOpen((v) => !v)}
          aria-label="Plus"
        >
          <span className="admin-bottom-nav-icon">
            {moreOpen ? <CloseIcon /> : <PlusIcon />}
          </span>
          <span>{moreOpen ? "Fermer" : "Plus"}</span>
        </button>
      </nav>

      {/* Sheet slide-up "Plus" */}
      {moreOpen && (
        <>
          <div className="admin-more-overlay" onClick={() => setMoreOpen(false)} />
          <div className="admin-more-sheet">
            <div className="admin-more-sheet-handle" />
            {secondaryItems.map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                className={`admin-more-item${isActive(href) ? " active" : ""}`}
                onClick={() => setMoreOpen(false)}
              >
                <span className="admin-more-item-icon">{icon}</span>
                <span>{label}</span>
              </Link>
            ))}
            <button
              className="admin-more-item admin-more-logout"
              onClick={() => { setMoreOpen(false); signOut({ callbackUrl: "/" }); }}
            >
              <span className="admin-more-item-icon"><LogoutIcon /></span>
              <span>Déconnexion</span>
            </button>
          </div>
        </>
      )}
    </>
  );
}
