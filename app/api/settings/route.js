export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Settings from "@/app/models/Settings";

export async function GET() {
  try {
    await connectDB();
    const settings = await Settings.findOne();
    return NextResponse.json({
      dropDate:        settings?.dropDate        ?? null,
      startDate:       settings?.updatedAt       ?? null,
      bandeauText:     settings?.bandeauText     ?? "",
      maintenanceMode: settings?.maintenanceMode ?? false,
    }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=60" },
    });
  } catch (err) {
    console.error("GET /api/settings:", err);
    return NextResponse.json({ dropDate: null, startDate: null, bandeauText: "", maintenanceMode: false }, { status: 500 });
  }
}
