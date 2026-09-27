export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB, isValidId } from "@/app/lib/db";
import User from "@/app/models/User";
import "@/app/models/Product";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });

    await connectDB();
    const user = await User.findOne({ email: session.user.email })
      .populate("favorites")
      .lean();

    if (!user) return NextResponse.json({ message: "Utilisateur introuvable" }, { status: 404 });

    return NextResponse.json(user.favorites ?? []);
  } catch (err) {
    console.error("GET /api/favorites:", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });

    const { productId } = await request.json();
    if (!isValidId(productId)) return NextResponse.json({ message: "productId invalide" }, { status: 400 });

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ message: "Utilisateur introuvable" }, { status: 404 });

    if (!user.favorites.includes(productId)) {
      user.favorites.push(productId);
      await user.save();
    }

    return NextResponse.json({ message: "Ajouté aux favoris" });
  } catch (err) {
    console.error("POST /api/favorites:", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });

    const { productId } = await request.json();
    if (!isValidId(productId)) return NextResponse.json({ message: "productId invalide" }, { status: 400 });

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ message: "Utilisateur introuvable" }, { status: 404 });

    user.favorites = user.favorites.filter((id) => id.toString() !== productId);
    await user.save();

    return NextResponse.json({ message: "Retiré des favoris" });
  } catch (err) {
    console.error("DELETE /api/favorites:", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
