import { connectDB } from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();  // connexion à Neon PostgreSQL
    return NextResponse.json({ message: "Atlas connecté ✅" });
  } catch (error) {
    return NextResponse.json({ message: "Erreur de connexion ❌", error: error.message }, { status: 500 });
  }
}
