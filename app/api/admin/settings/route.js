export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/auth";
import { connectDB } from "@/app/lib/db";
import Settings from "@/app/models/Settings";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  await connectDB();
  const settings = await Settings.findOne();
  return NextResponse.json({
    dropDate:        settings?.dropDate        ?? null,
    shippingReleaseDate: settings?.shippingReleaseDate ?? null,
    startDate:       settings?.updatedAt       ?? null,
    bandeauText:     settings?.bandeauText     ?? "",
    maintenanceMode: settings?.maintenanceMode ?? false,
  });
}

export async function PATCH(req) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json();
  const update = {};

  if ("dropDate" in body)        update.dropDate        = body.dropDate ? new Date(body.dropDate) : null;
  if ("shippingReleaseDate" in body) update.shippingReleaseDate = body.shippingReleaseDate ? new Date(body.shippingReleaseDate) : null;
  if ("bandeauText" in body)     update.bandeauText     = body.bandeauText ?? "";
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
    shippingReleaseDate: settings.shippingReleaseDate ?? null,
    startDate:       settings.updatedAt,
    bandeauText:     settings.bandeauText,
    maintenanceMode: settings.maintenanceMode,
  });
}
