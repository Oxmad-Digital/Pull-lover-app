import React from "react";
import "./globals.css";
import "./mantasoa-product.css";
import { Montserrat } from 'next/font/google';
import HeaderWrapper from "./components/HeaderWrapper";
import FooterWrapper from "./components/FooterWrapper";
import Providers from "./components/Providers";

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
});


export const metadata = {
  title: { default: "Pull Lover", template: "%s | Pull Lover" },
  description: "Boutique de mailles artisanales faites main à Antananarivo, Madagascar.",
  metadataBase: new URL("https://www.pull-lover.com"),
  openGraph: {
    siteName: "Pull Lover",
    type: "website",
    locale: "fr_FR",
  },
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
    <html lang="fr" className={montserrat.variable}>
      <body className={montserrat.className}>
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
