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
    startDate:       settings?.updatedAt       ?? null,
    bandeauText:     settings?.bandeauText     ?? "",
    bandeauEnabled:  settings?.bandeauEnabled  ?? true,
    ordersOpen:      settings?.ordersOpen      ?? true,
    maintenanceMode: settings?.maintenanceMode ?? false,
  });
}

export async function PATCH(req) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json();
  const update = {};

  if ("dropDate" in body)        update.dropDate        = body.dropDate ? new Date(body.dropDate) : null;
  if ("bandeauText" in body)     update.bandeauText     = body.bandeauText ?? "";
  if ("bandeauEnabled" in body)  update.bandeauEnabled  = !!body.bandeauEnabled;
  if ("ordersOpen" in body)      update.ordersOpen      = !!body.ordersOpen;
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
    bandeauEnabled:  settings.bandeauEnabled ?? true,
    ordersOpen:      settings.ordersOpen ?? true,
    maintenanceMode: settings.maintenanceMode,
  });
}
