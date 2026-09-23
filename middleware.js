import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// 🚧 Mode maintenance : n'affecte que ces domaines (le lien *.vercel.app reste
// toujours accessible pour continuer à travailler sur le site en prod).
const MAINTENANCE_HOSTS = ["pull-lover.com", "www.pull-lover.com"];

async function isMaintenanceModeOn(req) {
  try {
    const res = await fetch(new URL("/api/settings", req.url), {
      next: { revalidate: 5 },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.maintenanceMode;
  } catch {
    return false;
  }
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // ✅ Pages publiques
  if (
    pathname.startsWith("/auth/login") ||
    pathname.startsWith("/admin/unauthorized") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/maintenance") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    // Déduit du protocole réel de la requête (et non de NEXTAUTH_URL) pour
    // lire le bon cookie (__Secure-next-auth...) en production.
    secureCookie:
      (req.headers.get("x-forwarded-proto") || req.nextUrl.protocol.replace(":", "")) === "https",
  });

  // 🚧 ÉCRAN "SITE EN CONSTRUCTION"
  // Uniquement sur le domaine pull-lover.com, jamais sur /admin (pour pouvoir
  // désactiver le mode depuis les réglages) ni pour un admin déjà connecté.
  if (!pathname.startsWith("/admin")) {
    const host = (req.headers.get("host") || "").split(":")[0].toLowerCase();
    const isAdmin = token?.role === "admin";
    if (MAINTENANCE_HOSTS.includes(host) && !isAdmin && (await isMaintenanceModeOn(req))) {
      return NextResponse.redirect(new URL("/maintenance", req.url));
    }
  }

  // 🔒 PROTÉGER LES FAVORIS (connexion obligatoire)
  if (pathname.startsWith("/favoris")) {
    if (!token) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 🔒 PROTÉGER SEULEMENT LES SOUS-PAGES ADMIN
  if (pathname.startsWith("/admin/")) {
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    if (token.role !== "admin") {
      return NextResponse.redirect(
        new URL("/admin/unauthorized", req.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  // Tourne sur toutes les pages (hors assets/_next/api) pour pouvoir
  // appliquer l'écran de maintenance à l'ensemble du site public.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
