// app/lib/tokens.js
// Jetons envoyés par e-mail (vérification, réinitialisation) : seul leur hash est stocké en base,
// une fuite de la base ne permet donc pas de les rejouer.

import crypto from "crypto";

export const TOKEN_PATTERN = /^[a-f0-9]{64}$/;

export const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

/** @returns {{ token: string, hash: string }} token : à envoyer ; hash : à enregistrer */
export function createToken() {
  const token = crypto.randomBytes(32).toString("hex");
  return { token, hash: hashToken(token) };
}
