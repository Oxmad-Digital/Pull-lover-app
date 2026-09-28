import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getClient } from "./app/lib/db";

// 🚧 Mode maintenance : n'affecte que ces domaines (le lien *.vercel.app reste
// toujours accessible pour continuer à travailler sur le site en prod).
const MAINTENANCE_HOSTS = ["pull-lover.com", "www.pull-lover.com"];

// Lu directement en base (une ligne, un champ) et gardé en mémoire de l'instance :
// pas d'appel HTTP vers /api/settings à chaque navigation. Un changement dans les
// réglages admin est donc visible au plus tard après MAINTENANCE_TTL_MS.
const MAINTENANCE_TTL_MS = 10_000;
let maintenance = { on: false, expiresAt: 0 };

async function isMaintenanceModeOn() {
  const now = Date.now();
  if (now < maintenance.expiresAt) return maintenance.on;
  let on = false;
  try {
    const [row] = await getClient().query(
      `SELECT (data->>'maintenanceMode') = 'true' AS enabled FROM settings LIMIT 1`
    );
    on = !!row?.enabled;
  } catch {
    on = false;
  }
  maintenance = { on, expiresAt: now + MAINTENANCE_TTL_MS };
  return on;
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

  // Le JWT n'est décodé que si une règle en a besoin (et au plus une fois)
  let tokenPromise;
  const readToken = () => (tokenPromise ??= getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    // Déduit du protocole réel de la requête (et non de NEXTAUTH_URL) pour
    // lire le bon cookie (__Secure-next-auth...) en production.
    secureCookie:
      (req.headers.get("x-forwarded-proto") || req.nextUrl.protocol.replace(":", "")) === "https",
  }));

  // 🚧 ÉCRAN "SITE EN CONSTRUCTION"
  // Uniquement sur le domaine pull-lover.com, jamais sur /admin (pour pouvoir
  // désactiver le mode depuis les réglages) ni pour un admin déjà connecté.
  if (!pathname.startsWith("/admin")) {
    const host = (req.headers.get("host") || "").split(":")[0].toLowerCase();
    if (MAINTENANCE_HOSTS.includes(host) && (await isMaintenanceModeOn()) && (await readToken())?.role !== "admin") {
      return NextResponse.redirect(new URL("/maintenance", req.url));
    }
  }

  // 🔒 PROTÉGER LES FAVORIS (connexion obligatoire)
  if (pathname.startsWith("/favoris")) {
    if (!(await readToken())) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 🔒 PROTÉGER LES PAGES D'ADMINISTRATION
  if (pathname.startsWith("/admin/")) {
    const token = await readToken();
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
