// app/lib/trackingToken.js
// Secrets de la mesure d'audience, dérivés de NEXTAUTH_SECRET avec un libellé par usage :
// le secret de session n'est jamais utilisé tel quel, et les usages ne se recoupent pas.

import crypto from "crypto";

function derivedKey(label) {
  return crypto
    .createHmac("sha256", process.env.NEXTAUTH_SECRET ?? "")
    .update(`pull-lover:${label}`)
    .digest();
}

/**
 * Identifiant anonyme d'un visiteur pour la journée : l'IP n'est jamais stockée, et le hash
 * change chaque jour (impossible de suivre quelqu'un d'un jour à l'autre).
 */
export function visitorHash(ip, userAgent, day) {
  return crypto
    .createHmac("sha256", derivedKey("visitor-hash"))
    .update(`${ip}|${userAgent}|${day}`)
    .digest("hex")
    .slice(0, 32);
}

// Jeton renvoyé avec l'id d'une vue : prouve que l'appelant est celui qui l'a créée
// (sans lui, n'importe qui pourrait écraser la durée de n'importe quelle vue).
export function signViewId(id) {
  return crypto.createHmac("sha256", derivedKey("view-id")).update(id).digest("hex").slice(0, 32);
}

export function verifyViewId(id, token) {
  if (typeof token !== "string") return false;
  const expected = Buffer.from(signViewId(id));
  const given = Buffer.from(token);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}
