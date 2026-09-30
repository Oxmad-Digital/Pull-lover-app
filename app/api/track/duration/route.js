export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getClient, isValidId } from "@/app/lib/db";
import { verifyViewId } from "@/app/lib/trackingToken";

// Au-delà, l'onglet a sans doute été oublié ouvert
const MAX_DURATION_MS = 30 * 60 * 1000;

/**
 * Temps passé sur une page, envoyé en sendBeacon quand elle est quittée ou masquée.
 * Pas de limitation de débit : le jeton signé réserve la mise à jour à la vue que l'appelant a créée.
 */
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const id = body?.id;
  const duration = body?.duration;
  if (!isValidId(id) || !verifyViewId(id, body.token) || !Number.isFinite(duration) || duration <= 0) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  try {
    await getClient().query(`UPDATE page_views SET duration_ms = $2 WHERE id = $1`, [
      id,
      Math.round(Math.min(duration, MAX_DURATION_MS)),
    ]);
  } catch (error) {
    console.error("TRACK DURATION ERROR:", error.message);
  }

  return NextResponse.json({ ok: true });
}
