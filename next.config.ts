import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },
  serverExternalPackages: ["@neondatabase/serverless"],
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90],
    localPatterns: [
      { pathname: "/**", search: "" },
      { pathname: "/api/media/pull-lover-hero.webp" },
      { pathname: "/api/media/pull-lover-vue-de-haut-sur-le-lac.webp" },
      { pathname: "/api/media/pull-lover-manequin-cardigan-2.webp" },
    ],
  },
  async headers() {
    return [
      {
        // En-têtes de sécurité communs à toutes les réponses
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          // CSP minimale sans risque de casse (scripts inline de Next, Stripe, widget SendCloud) :
          // interdit l'intégration en iframe, les plugins et le détournement de <base> / des formulaires.
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" },
        ],
      },
      // En développement, Next gère lui-même le cache des fichiers statiques (le surcharger casse le HMR).
      ...(process.env.NODE_ENV === "production"
        ? [{
            source: "/_next/static/(.*)",
            headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
          }]
        : []),
      {
        source: "/api/products(.*)",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=60, stale-while-revalidate=300" }],
      },
    ];
  },
  async redirects() {
    // Anciennes URLs de la boutique multi-produits : redirigées définitivement vers
    // la fiche (un fragment comme /#piece est ignoré par les moteurs de recherche).
    return [
      { source: "/boutique", destination: "/products/cardigan-maille-milano", permanent: true },
      { source: "/boutique/:path*", destination: "/products/cardigan-maille-milano", permanent: true },
      { source: "/nos-mailles/:path*", destination: "/products/cardigan-maille-milano", permanent: true },
      // Ancienne URL de la fiche, renommée d'après le produit
      { source: "/products/mantasoa", destination: "/products/cardigan-maille-milano", permanent: true },
      { source: "/en/products/mantasoa", destination: "/en/products/cardigan-maille-milano", permanent: true },
      // Pages supprimées
      { source: "/NotreMarque", destination: "/", permanent: true },
      { source: "/notre-marque", destination: "/", permanent: true },
      { source: "/favoris", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
