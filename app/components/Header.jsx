"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "./CartContext";
import { BagIcon, UserIcon } from "./icons";
import { useLang } from "@/app/i18n/I18nProvider";
import { INTL_LOCALE, localePath, splitLocale } from "@/app/i18n/config.mjs";
import "./Header.css";

const TEXT = {
  fr: {
    links: [
      { label: "La pièce", href: "/products/cardigan-maille-milano" },
      { label: "L’atelier", href: "/#atelier" },
      { label: "Précommande", href: "/#precommande-info" },
      { label: "Contact", href: "/contact" },
    ],
    preorderUntil: "Précommandes ouvertes jusqu’au",
    pending: "— date à définir",
    remaining: (t) => `${t.days} jours, ${t.hours} heures, ${t.minutes} minutes et ${t.seconds} secondes restantes`,
    dayUnit: "j",
    skip: "Aller au contenu",
    home: "Pull-Lover, accueil",
    mainNav: "Navigation principale",
    account: "Mon compte",
    admin: "Administration",
    mySpace: "Mon espace",
    signIn: "Se connecter",
    signOut: "Se déconnecter",
    cart: (count) => `Panier, ${count} article${count > 1 ? "s" : ""}`,
    menu: "Menu de navigation",
    closeMenu: "Fermer le menu",
    close: "Fermer",
    cartLabel: "Panier",
    signature: "La passion de la maille.",
    mobileNav: "Navigation mobile",
    switchLabel: "English version",
  },
  en: {
    links: [
      { label: "The piece", href: "/products/cardigan-maille-milano" },
      { label: "The workshop", href: "/#atelier" },
      { label: "Pre-order", href: "/#precommande-info" },
      { label: "Contact", href: "/contact" },
    ],
    preorderUntil: "Pre-orders open until",
    pending: "— date to be announced",
    remaining: (t) => `${t.days} days, ${t.hours} hours, ${t.minutes} minutes and ${t.seconds} seconds left`,
    dayUnit: "d",
    skip: "Skip to content",
    home: "Pull-Lover, home",
    mainNav: "Main navigation",
    account: "My account",
    admin: "Administration",
    mySpace: "My account",
    signIn: "Sign in",
    signOut: "Sign out",
    cart: (count) => `Cart, ${count} item${count > 1 ? "s" : ""}`,
    menu: "Navigation menu",
    closeMenu: "Close menu",
    close: "Close",
    cartLabel: "Cart",
    signature: "A passion for knitwear.",
    mobileNav: "Mobile navigation",
    switchLabel: "Version française",
  },
};

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

// Isolé du header : seul ce bandeau se re-rend chaque seconde
function AnnouncementCountdown({ dropDate, lang, t }) {
  const [remainingTime, setRemainingTime] = useState(null);

  useEffect(() => {
    if (!dropDate) return;

    const updateCountdown = () => setRemainingTime(getRemainingTime(dropDate));
    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [dropDate]);

  const formattedDropDate = dropDate
    ? new Intl.DateTimeFormat(INTL_LOCALE[lang], { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(dropDate))
    : "";

  return (
    <div className="pl-announcement">
      {remainingTime ? (
        <div className="pl-announcement-countdown">
          <span>{t.preorderUntil} <time dateTime={dropDate}>{formattedDropDate}</time></span>
          <span className="pl-announcement-separator" aria-hidden="true" />
          <span className="pl-announcement-timer" aria-label={t.remaining(remainingTime)}>
            <strong>{padTime(remainingTime.days)}{t.dayUnit}</strong>
            <strong>{padTime(remainingTime.hours)}h</strong>
            <strong>{padTime(remainingTime.minutes)}m</strong>
            <strong>{padTime(remainingTime.seconds)}s</strong>
          </span>
        </div>
      ) : (
        <span>{t.preorderUntil} <strong className="pl-announcement-pending">{t.pending}</strong></span>
      )}
    </div>
  );
}

export default function Header({ transparent = false, dashboard = false }) {
  const lang = useLang();
  const t = TEXT[lang];
  const href = (path) => localePath(lang, path);
  const pathname = usePathname();
  const otherLang = lang === "fr" ? "en" : "fr";
  const switchHref = localePath(otherLang, splitLocale(pathname).path);
  const [dropDate, setDropDate] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { cartItems } = useCart();
  const { data: session } = useSession();
  const mobileMenu = useRef(null);
  const accountMenu = useRef(null);
  const count = cartItems.reduce((total, item) => total + (item.quantity || 0), 0);
  const isAdmin = session?.user?.role === "admin";
  const accountHref = isAdmin ? "/admin/dashboard" : href(session ? "/dashboard" : "/auth/login");

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
    const menu = mobileMenu.current;
    const mobileViewport = window.matchMedia("(max-width: 939px)");
    let previousOverflow;

    function syncMenuScroll() {
      if (!mobileViewport.matches) menu.open = false;
      setMobileMenuOpen(menu.open);
      if (menu.open && previousOverflow === undefined) {
        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
      } else if (!menu.open && previousOverflow !== undefined) {
        document.body.style.overflow = previousOverflow;
        previousOverflow = undefined;
      }
    }

    menu.addEventListener("toggle", syncMenuScroll);
    mobileViewport.addEventListener("change", syncMenuScroll);
    return () => {
      menu.removeEventListener("toggle", syncMenuScroll);
      mobileViewport.removeEventListener("change", syncMenuScroll);
      if (previousOverflow !== undefined) document.body.style.overflow = previousOverflow;
    };
  }, []);

  function closeMenus() {
    if (mobileMenu.current) mobileMenu.current.open = false;
    if (accountMenu.current) accountMenu.current.open = false;
  }

  return (
    <header className={`pl-header${transparent ? " pl-header-home" : ""}${dashboard ? " pl-header-dashboard" : ""}`}>
      <a className="pl-skip-link" href="#contenu">{t.skip}</a>
      <AnnouncementCountdown dropDate={dropDate} lang={lang} t={t} />
      <div className="pl-nav">
        <Link href={href("/")} className="pl-logo" aria-label={t.home}>
          <Image
            className="pl-logo-image"
            src="/api/media/pull-lover_logo_coeur_rouge-transparent.webp"
            alt=""
            width={500}
            height={500}
            sizes="(max-width: 599px) 52px, 60px"
            loading="eager"
          />
          <span className="pl-menu-wordmark" aria-hidden="true">Pull-Lover</span>
        </Link>
        <nav className="pl-nav-links" aria-label={t.mainNav}>
          {t.links.map((link) => <Link key={link.href} href={href(link.href)}>{link.label}</Link>)}
        </nav>
        <div className="pl-nav-actions">
          {/* Lien classique et non <Link> : la langue est le segment du layout racine, une navigation
              côté client reconstruirait tout le <html> (script de révélation non exécuté, classe pl-motion perdue). */}
          <a className="pl-lang-switch" href={switchHref} hrefLang={otherLang} lang={otherLang} aria-label={t.switchLabel} onClick={closeMenus}>
            {otherLang.toUpperCase()}
          </a>
          <details className="pl-account-menu" ref={accountMenu}>
            <summary className="pl-icon-button" aria-label={t.account}><UserIcon size={20} /></summary>
            <nav className="pl-account-panel" aria-label={t.account}>
              <Link href={accountHref} onClick={closeMenus}>{isAdmin ? t.admin : session ? t.mySpace : t.signIn}</Link>
              {session && <button onClick={() => { closeMenus(); signOut({ callbackUrl: href("/") }); }}>{t.signOut}</button>}
            </nav>
          </details>
          <Link href={href("/panier")} className="pl-icon-button pl-bag" aria-label={t.cart(count)}><BagIcon size={22} /><span className="pl-bag-count">{count}</span></Link>
          <details className="pl-mobile-menu" ref={mobileMenu}>
            <summary className="pl-icon-button" aria-label={mobileMenuOpen ? t.closeMenu : t.menu}>
              <span className="pl-menu-close-label" aria-hidden="true">{t.close}</span>
              <span className="pl-menu-toggle-icon"><span className="pl-menu-lines" aria-hidden="true" /></span>
            </summary>
            <nav className="pl-mobile-panel" aria-label={t.mobileNav}>
              <div className="pl-mobile-links">
                {t.links.map((link, index) => (
                  <Link className={`pl-mobile-link${index === 2 ? " pl-mobile-link-preorder" : ""}`} key={link.href} href={href(link.href)} onClick={closeMenus}>
                    <span className="pl-mobile-link-number" aria-hidden="true">0{index + 1}</span>
                    <span className="pl-mobile-link-label">{link.label}</span>
                  </Link>
                ))}
              </div>
              <div className="pl-mobile-footer">
                <div className="pl-mobile-utilities">
                  <Link href={accountHref} onClick={closeMenus}><UserIcon size={18} />{isAdmin ? t.admin : t.account}</Link>
                  <Link href={href("/panier")} aria-label={t.cart(count)} onClick={closeMenus}><BagIcon size={18} />{t.cartLabel}<span className="pl-mobile-cart-count">{count}</span></Link>
                </div>
                <div className="pl-mobile-meta">
                  <span>{t.signature}</span>
                  <div className="pl-mobile-languages">
                    <span aria-current="true" lang={lang}>{lang.toUpperCase()}</span>
                    <span aria-hidden="true">/</span>
                    <a href={switchHref} hrefLang={otherLang} lang={otherLang} aria-label={t.switchLabel} onClick={closeMenus}>{otherLang.toUpperCase()}</a>
                  </div>
                </div>
              </div>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
