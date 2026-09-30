export const runtime = "nodejs";

import { NextResponse, userAgent } from "next/server";
import { getToken } from "next-auth/jwt";
import { getClient } from "@/app/lib/db";
import { clientIp, rateLimit } from "@/app/lib/rateLimit";
import { referrerHost, trackedPath } from "@/app/lib/analytics.mjs";
import { signViewId, visitorHash } from "@/app/lib/trackingToken";

// Durée de conservation des vues (recommandation CNIL pour la mesure d'audience : 13 mois)
const RETENTION_DAYS = 395;

const ignored = () => NextResponse.json({ ok: true });

/** Enregistre une page vue, envoyée par app/components/Tracker.jsx. */
export async function POST(req) {
  const { isBot, device } = userAgent(req);
  if (isBot) return ignored();

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  // Chemins inconnus (admin, 404, valeurs forgées) : ignorés sans erreur
  const path = trackedPath(body?.path);
  if (!path) return ignored();

  const host = req.headers.get("host");
  const origin = req.headers.get("origin");
  if (origin && host) {
    let originHost = "";
    try { originHost = new URL(origin).host; } catch {}
    if (originHost !== host) return NextResponse.json({ error: "Origine refusée" }, { status: 403 });
  }

  // Les administrateurs qui consultent le site ne faussent pas les chiffres
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: (req.headers.get("x-forwarded-proto") || req.nextUrl.protocol.replace(":", "")) === "https",
  }).catch(() => null);
  if (token?.role === "admin") return ignored();

  const ip = clientIp(req);
  const { allowed } = await rateLimit(`track:${ip}`, { limit: 120, windowMs: 60_000 });
  if (!allowed) return ignored();

  const day = new Date().toISOString().slice(0, 10);
  const id = crypto.randomUUID();

  try {
    const sql = getClient();
    await sql.query(
      `INSERT INTO page_views (id, day, path, referrer, device_type, country, visitor_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        day,
        path,
        referrerHost(body.referrer, host),
        device.type ?? "desktop",
        (req.headers.get("x-vercel-ip-country") ?? "").slice(0, 2).toUpperCase(),
        visitorHash(ip, req.headers.get("user-agent") ?? "", day),
      ]
    );
    // Ménage occasionnel des vues trop anciennes
    if (Math.random() < 0.01) {
      sql.query(`DELETE FROM page_views WHERE day < current_date - $1::int`, [RETENTION_DAYS]).catch(() => {});
    }
  } catch (error) {
    // La mesure d'audience ne doit jamais gêner la navigation
    console.error("TRACK ERROR:", error.message);
    return ignored();
  }

  return NextResponse.json({ ok: true, id, token: signViewId(id) });
}
