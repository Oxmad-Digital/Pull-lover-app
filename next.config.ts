import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },
  serverExternalPackages: ["@neondatabase/serverless"],
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
        source: "/icons/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/api/products(.*)",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=60, stale-while-revalidate=300" }],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/boutique",
        destination: "/#piece",
        permanent: false,
      },
      {
        source: "/boutique/:path*",
        destination: "/#piece",
        permanent: false,
      },
      {
        source: "/nos-mailles/:path*",
        destination: "/#piece",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
