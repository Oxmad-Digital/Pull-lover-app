import React from "react";
import "../globals.css";
import { notFound } from "next/navigation";
import Script from "next/script";
import { montserrat } from "../fonts";
import HeaderWrapper from "@/app/components/HeaderWrapper";
import FooterWrapper from "@/app/components/FooterWrapper";
import Providers from "@/app/components/Providers";
import SiteReveal from "@/app/components/SiteReveal";
import Tracker from "@/app/components/Tracker";
import { I18nProvider } from "@/app/i18n/I18nProvider";
import { LOCALES, isLocale, toLocale } from "@/app/i18n/config.mjs";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, openGraphBase } from "@/app/lib/seo";

// Posé avant le premier rendu pour que les éléments à révéler soient cachés dès l'affichage.
// Filet de sécurité : si SiteReveal ne démarre pas en 4 s, tout redevient visible.
const revealBootstrap = `(function(){try{if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;var d=document.documentElement;d.classList.add("pl-motion");setTimeout(function(){if(!window.__plReveal)d.classList.remove("pl-motion")},4000)}catch(e){}})()`;

// Les deux langues sont pré-rendues. Pas de dynamicParams = false : il s'appliquerait aussi aux
// segments enfants (fiches produit, 404). Le proxy ne réécrit de toute façon que vers /fr ou /en.
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

const TAGLINE = { fr: "Maille de Madagascar", en: "Knitwear from Madagascar" };

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const locale = toLocale((await params).lang);
  return {
    title: { default: `${SITE_NAME} — ${TAGLINE[locale]}`, template: `%s | ${SITE_NAME}` },
    description: SITE_DESCRIPTION[locale],
    applicationName: SITE_NAME,
    metadataBase: new URL(SITE_URL),
    openGraph: openGraphBase(locale),
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <html lang={lang} className={montserrat.variable} suppressHydrationWarning>
      <body className={montserrat.className}>
        <Script id="pl-reveal-bootstrap" strategy="beforeInteractive">
          {revealBootstrap}
        </Script>
        <SiteReveal />
        <Tracker />
        <I18nProvider lang={lang}>
          <Providers>
            <HeaderWrapper />
            <main id="contenu" style={{ background: "transparent" }}>
              {children}
            </main>
            <FooterWrapper />
          </Providers>
        </I18nProvider>
      </body>
    </html>
  );
}
