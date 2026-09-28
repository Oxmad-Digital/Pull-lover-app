import React from "react";
import "./globals.css";
import "./mantasoa-product.css";
import { Montserrat } from 'next/font/google';
import HeaderWrapper from "./components/HeaderWrapper";
import FooterWrapper from "./components/FooterWrapper";
import Providers from "./components/Providers";
import SiteReveal from "./components/SiteReveal";
import { OPEN_GRAPH_BASE, SITE_NAME, SITE_URL } from "./lib/seo";

// Posé avant le premier rendu pour que les éléments à révéler soient cachés dès l'affichage.
// Filet de sécurité : si SiteReveal ne démarre pas en 4 s, tout redevient visible.
const revealBootstrap = `(function(){try{if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;var d=document.documentElement;d.classList.add("pl-motion");setTimeout(function(){if(!window.__plReveal)d.classList.remove("pl-motion")},4000)}catch(e){}})()`;

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
});


export const metadata = {
  title: { default: `${SITE_NAME} — Maille de Madagascar`, template: `%s | ${SITE_NAME}` },
  description: "Mailles artisanales fabriquées à la demande dans notre atelier familial à Antananarivo, Madagascar.",
  applicationName: SITE_NAME,
  metadataBase: new URL(SITE_URL),
  openGraph: OPEN_GRAPH_BASE,
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={montserrat.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: revealBootstrap }} />
      </head>
      <body className={montserrat.className}>
        <SiteReveal />
        <Providers>
          <HeaderWrapper />
          <main id="contenu" style={{ background: "transparent" }}>
            {children}
          </main>
          <FooterWrapper />
        </Providers>
      </body>
    </html>
  );
}
