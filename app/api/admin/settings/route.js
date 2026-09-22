export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/app/lib/db";
import Settings from "@/app/models/Settings";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") return null;
  return session;
}

export async function GET() {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  await connectDB();
  const settings = await Settings.findOne();
  return NextResponse.json({
    dropDate:        settings?.dropDate        ?? null,
    startDate:       settings?.updatedAt       ?? null,
    bandeauText:     settings?.bandeauText     ?? "",
    badgeText:       settings?.badgeText       ?? "",
    maintenanceMode: settings?.maintenanceMode ?? false,
  });
}

export async function PATCH(req) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const body = await req.json();
  const update = {};

  if ("dropDate" in body)        update.dropDate        = body.dropDate ? new Date(body.dropDate) : null;
  if ("bandeauText" in body)     update.bandeauText     = body.bandeauText ?? "";
  if ("badgeText" in body)       update.badgeText       = body.badgeText   ?? "";
  if ("maintenanceMode" in body) update.maintenanceMode = !!body.maintenanceMode;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Aucun champ à mettre à jour" }, { status: 400 });
  }

  await connectDB();
  const settings = await Settings.findOneAndUpdate(
    {},
    update,
    { upsert: true, new: true }
  );
  return NextResponse.json({
    dropDate:        settings.dropDate,
    startDate:       settings.updatedAt,
    bandeauText:     settings.bandeauText,
    badgeText:       settings.badgeText,
    maintenanceMode: settings.maintenanceMode,
  });
}
