"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { HomeIcon, OrdersIcon, UserIcon, MapPinIcon, LogoutIcon } from "@/app/components/icons";
import { useLang } from "@/app/i18n/I18nProvider";
import { localePath, splitLocale } from "@/app/i18n/config.mjs";

const TEXT = {
  fr: {
    items: [["Vue d'ensemble", "Dashboard"], ["Commandes", "Commandes"], ["Profil", "Profil"], ["Adresses", "Adresses"]],
    logout: "Déconnexion",
    logoutShort: "Sortir",
  },
  en: {
    items: [["Overview", "Dashboard"], ["Orders", "Orders"], ["Profile", "Profile"], ["Addresses", "Addresses"]],
    logout: "Sign out",
    logoutShort: "Sign out",
  },
};

const MENU = [
  { icon: <HomeIcon />, path: "/dashboard" },
  { icon: <OrdersIcon />, path: "/dashboard/orders" },
  { icon: <UserIcon />, path: "/dashboard/profile" },
  { icon: <MapPinIcon />, path: "/dashboard/addresses" },
];

export default function Sidebar({ user }) {
  const lang = useLang();
  const t = TEXT[lang];
  const { path: pathname } = splitLocale(usePathname());
  const signOutToHome = () => signOut({ callbackUrl: localePath(lang, "/") });

  const menuItems = MENU.map((item, index) => ({
    ...item,
    label: t.items[index][0],
    short: t.items[index][1],
    href: localePath(lang, item.path),
  }));

  return (
    <>
      {/* Sidebar desktop / tablette */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="user-avatar">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <h3>{user.name}</h3>
            <p>{user.email}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              href={item.href}
              className={`nav-item ${pathname === item.path ? "active" : ""}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            onClick={signOutToHome}
            className="logout-btn"
          >
            <LogoutIcon />
            <span>{t.logout}</span>
          </button>
        </div>
      </aside>

      {/* Bottom nav mobile */}
      <nav className="bottom-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            href={item.href}
            className={`bottom-nav-item ${pathname === item.path ? "active" : ""}`}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span>{item.short}</span>
          </Link>
        ))}
        <button
          className="bottom-nav-item"
          onClick={signOutToHome}
        >
          <span className="bottom-nav-icon">
            <LogoutIcon size={20} />
          </span>
          <span>{t.logoutShort}</span>
        </button>
      </nav>
    </>
  );
}
