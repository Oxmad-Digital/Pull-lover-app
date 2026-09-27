// app/lib/auth.js
// Contrôles d'accès communs aux routes API (le middleware laisse passer /api/*).

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/** Session si l'utilisateur est administrateur, sinon null. */
export async function getAdminSession() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "admin" ? session : null;
}

/** null si admin, sinon la réponse 401 à renvoyer telle quelle. */
export async function requireAdmin() {
  if (await getAdminSession()) return null;
  return NextResponse.json({ message: "Accès refusé" }, { status: 401 });
}
