import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/auth";
import { connectDB } from "@/app/lib/db";
import NewsletterSubscriber from "@/app/models/NewsletterSubscriber";
import { escapeRegex } from "@/app/lib/text";

export async function GET(req) {
  const deny = await requireAdmin();
  if (deny) return deny;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const page   = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit  = 50;

  const query = search ? { email: { $regex: escapeRegex(search), $options: "i" } } : {};
  const total = await NewsletterSubscriber.countDocuments(query);
  const subscribers = await NewsletterSubscriber.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return NextResponse.json({ subscribers, total, totalPages: Math.ceil(total / limit) });
}

export async function POST(req) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });

  await connectDB();
  try {
    const subscriber = await NewsletterSubscriber.create({ email });
    return NextResponse.json({ subscriber }, { status: 201 });
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json({ error: "Cet email est déjà abonné" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const { id } = await req.json();
  await connectDB();
  await NewsletterSubscriber.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
