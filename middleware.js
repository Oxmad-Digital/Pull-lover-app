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

// Servi tel quel à l'URL demandée avec un statut 503 + Retry-After : Google comprend
// que l'indisponibilité est temporaire et garde les pages dans son index (une
// redirection vers une page noindex finirait par les faire désindexer).
const MAINTENANCE_HTML = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Bientôt de retour | Pull-Lover</title>
<style>
  html, body { height: 100%; margin: 0; }
  body { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem;
    padding: 2rem; box-sizing: border-box; text-align: center; background: #fff; color: #1a1a1a;
    font-family: Montserrat, system-ui, sans-serif; }
  img { width: 140px; height: auto; margin-bottom: 1rem; }
  h1 { margin: 0; font-size: 1.5rem; font-weight: 500; letter-spacing: .01em; }
  p { margin: 0; font-size: .95rem; color: #777; }
</style>
</head>
<body>
  <img src="/pull-lover_logo_coeur_rouge-transparent.webp" alt="Pull-Lover" width="160" height="160">
  <h1>Bientôt de retour.</h1>
  <p>Notre site est en cours de préparation.</p>
</body>
</html>`;

// Une seule URL par fiche : /products/<uuid> renvoie en 308 vers /products/<slug>.
// Fait ici et non dans la page : un redirect() dans une page mise en cache (ISR)
// part en 200 + meta refresh au lieu d'un vrai code 308.
const PRODUCT_ID_PATH = /^\/products\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i;

async function productSlug(id) {
  try {
    const [row] = await getClient().query(`SELECT data->>'slug' AS slug FROM products WHERE id = $1`, [id]);
    return row?.slug || null;
  } catch {
    return null;
  }
}

function maintenanceResponse() {
  return new NextResponse(MAINTENANCE_HTML, {
    status: 503,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Retry-After": "3600",
      "Cache-Control": "no-store",
    },
  });
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // ✅ Pages publiques
  if (
    pathname.startsWith("/auth/login") ||
    pathname.startsWith("/admin/unauthorized") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
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
      return maintenanceResponse();
    }
  }

  const productId = pathname.match(PRODUCT_ID_PATH)?.[1];
  if (productId) {
    const slug = await productSlug(productId);
    if (slug) return NextResponse.redirect(new URL(`/products/${encodeURIComponent(slug)}`, req.url), 308);
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
