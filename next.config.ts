import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },
  serverExternalPackages: ["@neondatabase/serverless"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: process.env.NODE_ENV === "production"
              ? "public, max-age=31536000, immutable"
              : "no-store, max-age=0",
          },
        ],
      },
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
      { source: "/boutique", destination: "/products/mantasoa", permanent: true },
      { source: "/boutique/:path*", destination: "/products/mantasoa", permanent: true },
      { source: "/nos-mailles/:path*", destination: "/products/mantasoa", permanent: true },
      { source: "/NotreMarque", destination: "/notre-marque", permanent: true },
    ];
  },
};

export default nextConfig;
