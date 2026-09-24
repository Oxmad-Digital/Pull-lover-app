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

function getRemainingTime(target) {
  if (!target) return null;
  const difference = new Date(target).getTime() - Date.now();
  if (!Number.isFinite(difference) || difference <= 0) return null;
  return {
    days: Math.floor(difference / 86400000),
    hours: Math.floor((difference % 86400000) / 3600000),
    minutes: Math.floor((difference % 3600000) / 60000),
    seconds: Math.floor((difference % 60000) / 1000),
  };
}

function padTime(value) {
  return String(value).padStart(2, "0");
}

export default function Header({ transparent = false, dashboard = false }) {
  const [dropDate, setDropDate] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);
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
      .then((data) => {
        if (!data) return;
        setDropDate(data.dropDate || null);
      })
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

  useEffect(() => {
    if (!dropDate) return;

    const updateCountdown = () => setRemainingTime(getRemainingTime(dropDate));
    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [dropDate]);

  function closeMenus() {
    if (mobileMenu.current) mobileMenu.current.open = false;
    if (accountMenu.current) accountMenu.current.open = false;
  }

  const formattedDropDate = dropDate
    ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(dropDate))
    : "";

  return (
    <header className={`pl-header${transparent ? " pl-header-home" : ""}${dashboard ? " pl-header-dashboard" : ""}`}>
      <a className="pl-skip-link" href="#contenu">Aller au contenu</a>
      <div className="pl-announcement">
        {remainingTime ? (
          <div className="pl-announcement-countdown">
            <span>Précommandes ouvertes jusqu’au <time dateTime={dropDate}>{formattedDropDate}</time></span>
            <span className="pl-announcement-separator" aria-hidden="true" />
            <span
              className="pl-announcement-timer"
              aria-label={`${remainingTime.days} jours, ${remainingTime.hours} heures, ${remainingTime.minutes} minutes et ${remainingTime.seconds} secondes restantes`}
            >
              <strong>{padTime(remainingTime.days)}j</strong>
              <strong>{padTime(remainingTime.hours)}h</strong>
              <strong>{padTime(remainingTime.minutes)}m</strong>
              <strong>{padTime(remainingTime.seconds)}s</strong>
            </span>
          </div>
        ) : (
          <span>Précommandes ouvertes jusqu’au <strong className="pl-announcement-pending">— date à définir</strong></span>
        )}
      </div>
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
