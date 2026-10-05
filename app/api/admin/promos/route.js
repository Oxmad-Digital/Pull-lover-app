import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/auth";
import { connectDB } from "@/app/lib/db";
import Promo from "@/app/models/Promo";
import { escapeRegex } from "@/app/lib/text";

const PROMO_TYPES = ["percentage", "fixed"];

/** Message d'erreur si la promo (complète, après fusion des modifications) est incohérente, sinon null. */
function promoError({ code, type, value }) {
  if (typeof code !== "string" || !code.trim() || code.length > 50) return "Code invalide";
  if (!PROMO_TYPES.includes(type)) return "Type de remise invalide";
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "Valeur de remise invalide";
  if (type === "percentage" && amount > 100) return "Un pourcentage ne peut pas dépasser 100";
  return null;
}

export async function GET(req) {
  const deny = await requireAdmin();
  if (deny) return deny;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const query = search ? { code: { $regex: escapeRegex(search), $options: "i" } } : {};
  const promos = await Promo.find(query).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ promos });
}

export async function POST(req) {
  const deny = await requireAdmin();
  if (deny) return deny;

  await connectDB();
  const body = await req.json().catch(() => ({}));
  const invalid = promoError(body);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
  try {
    const promo = await Promo.create({
      code: body.code.toUpperCase().trim(),
      description: body.description || "",
      type: body.type,
      value: Number(body.value),
      minOrderAmount: Number(body.minOrderAmount) || 0,
      maxUses: body.maxUses ? Number(body.maxUses) : null,
      expiresAt: body.expiresAt || null,
      isActive: body.isActive !== false,
    });
    return NextResponse.json({ promo }, { status: 201 });
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json({ error: "Ce code existe déjà" }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PATCH(req) {
  const deny = await requireAdmin();
  if (deny) return deny;

  await connectDB();
  const { id, ...body } = await req.json();
  const EDITABLE = ["code", "description", "type", "value", "minOrderAmount", "maxUses", "expiresAt", "isActive"];
  const updates = Object.fromEntries(Object.entries(body).filter(([key]) => EDITABLE.includes(key)));
  if (typeof updates.code === "string") updates.code = updates.code.toUpperCase().trim();
  const existing = await Promo.findById(id);
  if (!existing) return NextResponse.json({ error: "Promo introuvable" }, { status: 404 });
  const invalid = promoError({ ...existing.toObject(), ...updates });
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
  const promo = await Promo.findByIdAndUpdate(id, { $set: updates }, { new: true });
  if (!promo) return NextResponse.json({ error: "Promo introuvable" }, { status: 404 });
  return NextResponse.json({ promo });
}

export async function DELETE(req) {
  const deny = await requireAdmin();
  if (deny) return deny;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  await Promo.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
