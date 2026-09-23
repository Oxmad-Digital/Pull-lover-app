"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "./CartContext";
import { BagIcon, UserIcon } from "./icons";
import "./Header.css";

const links = [
  { label: "La pièce", href: "/#piece" },
  { label: "L’atelier", href: "/#atelier" },
  { label: "Précommande", href: "/#precommande-info" },
];

export default function Header({ transparent = false }) {
  const [bandeauText, setBandeauText] = useState("");
  const { cartItems } = useCart();
  const { data: session } = useSession();
  const mobileMenu = useRef(null);
  const accountMenu = useRef(null);
  const count = cartItems.reduce((total, item) => total + (item.quantity || 0), 0);
  const accountHref = session?.user?.role === "admin" ? "/admin/dashboard" : session ? "/dashboard" : "/auth/login";

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/settings", { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (data) setBandeauText(data.bandeauText || ""); })
      .catch(() => {});
    function dismiss(event) {
      for (const ref of [mobileMenu, accountMenu]) {
        if (!ref.current?.open) continue;
        if (event.type === "keydown" && event.key === "Escape") {
          ref.current.open = false;
          ref.current.querySelector("summary")?.focus();
        } else if (event.type === "pointerdown" && !ref.current.contains(event.target)) {
          ref.current.open = false;
        }
      }
    }
    document.addEventListener("keydown", dismiss);
    document.addEventListener("pointerdown", dismiss);
    return () => {
      controller.abort();
      document.removeEventListener("keydown", dismiss);
      document.removeEventListener("pointerdown", dismiss);
    };
  }, []);

  function closeMenus() {
    if (mobileMenu.current) mobileMenu.current.open = false;
    if (accountMenu.current) accountMenu.current.open = false;
  }

  return (
    <header className={`pl-header${transparent ? " pl-header-home" : ""}`}>
      <a className="pl-skip-link" href="#contenu">Aller au contenu</a>
      <div className="pl-announcement">{bandeauText || "Une maille essentielle · Imaginée et fabriquée à Madagascar"}</div>
      <div className="pl-nav">
        <Link href="/" className="pl-logo" aria-label="Pull-Lover, accueil">
          <Image
            className="pl-logo-image"
            src="/api/media/pull-lover_logo_coeur_rouge-transparent.webp"
            alt=""
            width={500}
            height={500}
            sizes="(max-width: 599px) 52px, 60px"
            priority
          />
        </Link>
        <nav className="pl-nav-links" aria-label="Navigation principale">
          {links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
        </nav>
        <div className="pl-nav-actions">
          <details className="pl-account-menu" ref={accountMenu}>
            <summary className="pl-icon-button" aria-label="Mon compte"><UserIcon size={20} /></summary>
            <nav className="pl-account-panel" aria-label="Mon compte">
              <Link href={accountHref} onClick={closeMenus}>{session?.user?.role === "admin" ? "Administration" : session ? "Mon espace" : "Se connecter"}</Link>
              <Link href="/favoris" onClick={closeMenus}>Mes favoris</Link>
              <Link href="/contact" onClick={closeMenus}>Nous écrire</Link>
              {session && <button onClick={() => { closeMenus(); signOut({ callbackUrl: "/" }); }}>Se déconnecter</button>}
            </nav>
          </details>
          <Link href="/panier" className="pl-icon-button pl-bag" aria-label={`Panier, ${count} article${count > 1 ? "s" : ""}`}><BagIcon size={22} /><span className="pl-bag-count">{count}</span></Link>
          <details className="pl-mobile-menu" ref={mobileMenu}>
            <summary className="pl-icon-button" aria-label="Menu de navigation"><span className="pl-menu-lines" aria-hidden="true" /></summary>
            <nav className="pl-mobile-panel" aria-label="Navigation mobile">
              {links.map((link) => <Link key={link.href} href={link.href} onClick={closeMenus}>{link.label}<span aria-hidden="true">↗</span></Link>)}
              <Link href={accountHref} onClick={closeMenus}>{session?.user?.role === "admin" ? "Administration" : "Mon compte"}</Link>
              <Link href="/contact" onClick={closeMenus}>Nous écrire</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
