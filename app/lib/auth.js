// app/lib/auth.js
// Contrôles d'accès communs aux routes API (le proxy laisse passer /api/*).

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/lib/authOptions";

/** Session si l'utilisateur est administrateur, sinon null. */
export async function getAdminSession() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "admin" ? session : null;
}

/** null si admin, sinon la réponse 401 à renvoyer telle quelle. */
export async function requireAdmin() {
  if (await getAdminSession()) return null;
  // Les écrans admin lisent `message` ou `error` selon l'API : on fournit les deux.
  return NextResponse.json({ message: "Accès refusé", error: "Accès refusé" }, { status: 401 });
}
