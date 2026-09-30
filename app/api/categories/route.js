export const runtime = "nodejs";
export const revalidate = 3600;

import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Category from "@/app/models/Category";
import { requireAdmin } from "@/app/lib/auth";

export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find().sort({ createdAt: -1 });
    return NextResponse.json(categories, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch {
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    await connectDB();
    const { name } = await req.json();
    if (!name?.trim())
      return NextResponse.json({ message: "Nom requis" }, { status: 400 });
    const exists = await Category.findOne({ name: name.trim() });
    if (exists)
      return NextResponse.json({ message: "Catégorie déjà existante" }, { status: 400 });
    const category = await Category.create({ name: name.trim() });
    return NextResponse.json(category, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    await connectDB();
    const { id, name } = await req.json();
    if (!id || !name?.trim())
      return NextResponse.json({ message: "id et nom requis" }, { status: 400 });
    const exists = await Category.findOne({ name: name.trim(), _id: { $ne: id } });
    if (exists)
      return NextResponse.json({ message: "Nom déjà utilisé" }, { status: 400 });
    const updated = await Category.findByIdAndUpdate(id, { name: name.trim() }, { new: true });
    if (!updated)
      return NextResponse.json({ message: "Catégorie introuvable" }, { status: 404 });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json({ message: "id requis" }, { status: 400 });
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted)
      return NextResponse.json({ message: "Catégorie introuvable" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
