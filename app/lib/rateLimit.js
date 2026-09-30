// app/lib/rateLimit.js
// Limitation de débit partagée entre toutes les instances serverless (table rate_limits, créée
// par `npm run migrate`) : un compteur en mémoire serait propre à chaque instance Vercel.

import { getClient } from "@/app/lib/db";

/**
 * IP du client. Sur Vercel, x-real-ip et le premier élément de x-forwarded-for sont posés par
 * la plateforme (le client ne peut pas les forger). Accepte un objet Headers (route handlers)
 * ou un objet simple (req.headers de NextAuth).
 */
export function clientIp(source) {
  const headers = source?.headers ?? source;
  const get = (name) => (typeof headers?.get === "function" ? headers.get(name) : headers?.[name]);
  return String(get("x-real-ip") || get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
}

/**
 * Compte une tentative pour `key` et indique si la limite est dépassée.
 * En cas d'erreur base (table absente avant migration…), la requête est laissée passer :
 * la limitation ne doit jamais rendre le site indisponible.
 * @returns {Promise<{ allowed: boolean, retryAfter: number }>} retryAfter en secondes
 */
export async function rateLimit(key, { limit, windowMs }) {
  try {
    const sql = getClient();
    const [row] = await sql.query(
      `INSERT INTO rate_limits (key, count, reset_at)
       VALUES ($1, 1, now() + make_interval(secs => $2::float8))
       ON CONFLICT (key) DO UPDATE SET
         count    = CASE WHEN rate_limits.reset_at <= now() THEN 1 ELSE rate_limits.count + 1 END,
         reset_at = CASE WHEN rate_limits.reset_at <= now() THEN EXCLUDED.reset_at ELSE rate_limits.reset_at END
       RETURNING count, reset_at`,
      [key, windowMs / 1000]
    );
    // Ménage occasionnel des compteurs expirés
    if (Math.random() < 0.01) sql.query(`DELETE FROM rate_limits WHERE reset_at < now()`).catch(() => {});

    const retryAfter = Math.max(1, Math.ceil((new Date(row.reset_at).getTime() - Date.now()) / 1000));
    return { allowed: row.count <= limit, retryAfter };
  } catch (error) {
    console.error("RATE LIMIT ERROR:", error.message);
    return { allowed: true, retryAfter: 0 };
  }
}
