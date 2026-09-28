"use client";

import Link from "next/link";
import Image from "next/image";
import { useLang } from "@/app/i18n/I18nProvider";
import { localePath } from "@/app/i18n/config.mjs";
import "./Footer.css";

const TEXT = {
  fr: {
    home: "Pull-Lover, accueil",
    discoverLabel: "Découvrir Pull-Lover",
    discover: "Découvrir",
    discoverLinks: [["/products/mantasoa", "Cardigan en maille"], ["/#atelier", "Notre atelier"], ["/#precommande-info", "La précommande"]],
    contactLabel: "Restons en lien",
    contactLinks: [["/contact", "Nous contacter"], ["/dashboard", "Mon compte"]],
    madeIn: "Imaginé et fabriqué à Madagascar",
    legalLabel: "Informations légales",
    legalLinks: [["/mentions-legales", "Mentions légales"], ["/conditions-de-vente", "Conditions de vente"], ["/politique-de-confidentialite", "Confidentialité"]],
    credit: "Réalisé par",
  },
  en: {
    home: "Pull-Lover, home",
    discoverLabel: "Discover Pull-Lover",
    discover: "Discover",
    discoverLinks: [["/products/mantasoa", "Knit cardigan"], ["/#atelier", "Our workshop"], ["/#precommande-info", "How pre-order works"]],
    contactLabel: "Stay in touch",
    contactLinks: [["/contact", "Contact us"], ["/dashboard", "My account"]],
    madeIn: "Designed and made in Madagascar",
    legalLabel: "Legal information",
    legalLinks: [["/mentions-legales", "Legal notice"], ["/conditions-de-vente", "Terms of sale"], ["/politique-de-confidentialite", "Privacy"]],
    credit: "Made by",
  },
};

export default function Footer() {
  const lang = useLang();
  const t = TEXT[lang];
  const links = (items) => items.map(([path, label]) => <Link key={path} href={localePath(lang, path)}>{label}</Link>);

  return (
    <footer className="pl-footer">
      <div className="pl-footer-main" data-reveal-stagger>
        <Link className="pl-footer-brand" href={localePath(lang, "/")} aria-label={t.home}>
          <Image
            className="pl-footer-logo"
            src="/api/media/pull-lover_logo_coeur_rouge-transparent.webp"
            alt=""
            width={500}
            height={500}
            sizes="(max-width: 599px) 112px, 144px"
          />
        </Link>
        <nav className="pl-footer-column" aria-label={t.discoverLabel}>
          <h2>{t.discover}</h2>
          {links(t.discoverLinks)}
        </nav>
        <nav className="pl-footer-column" aria-label={t.contactLabel}>
          <h2>{t.contactLabel}</h2>
          {links(t.contactLinks)}
        </nav>
      </div>
      <div className="pl-footer-bottom" data-reveal-stagger>
        <p>© {new Date().getFullYear()} Pull-Lover</p>
        <p>{t.madeIn}</p>
        <nav aria-label={t.legalLabel}>
          {links(t.legalLinks)}
        </nav>
      </div>
      <p className="pl-footer-credit">{t.credit} <a href="https://oxmad-digital.mg" target="_blank" rel="noopener noreferrer">Oxmad Digital</a></p>
    </footer>
  );
}
