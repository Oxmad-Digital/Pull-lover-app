"use client";

import Image from "next/image";
import { useLang } from "@/app/i18n/I18nProvider";

const TEXT = {
  fr: { eyebrow: "Maille de Madagascar", origin: "Atelier familial · Antananarivo" },
  en: { eyebrow: "Knitwear from Madagascar", origin: "Family workshop · Antananarivo" },
};

export default function AuthShell({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  visualTitle,
  visualText,
  variant,
  children,
}) {
  const t = TEXT[useLang()];
  return (
    <section className={`auth-page auth-page-${variant}`}>
      <div className="auth-visual">
        <Image
          src={image}
          alt={imageAlt}
          fill
          priority
          sizes="(max-width: 939px) 100vw, 52vw"
        />
        <div className="auth-visual-copy" data-reveal-stagger>
          <p className="auth-eyebrow">{t.eyebrow}</p>
          <h2>{visualTitle}</h2>
          <p>{visualText}</p>
        </div>
        <p className="auth-origin">{t.origin}</p>
      </div>

      <div className="auth-content">
        <div className="auth-panel">
          <header className="auth-heading" data-reveal-stagger>
            <p className="auth-eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p>{description}</p>
          </header>
          {children}
        </div>
      </div>
    </section>
  );
}
