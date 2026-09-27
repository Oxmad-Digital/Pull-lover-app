import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });

    const { street, city, postalCode, country } = await request.json();

    if (!street || !city || !postalCode) {
      return NextResponse.json({ message: "Rue, ville et code postal sont obligatoires" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { address: { street: street.trim(), city: city.trim(), postalCode: postalCode.trim(), country: (country || "").trim() } },
      { new: true }
    );

    if (!user) return NextResponse.json({ message: "Utilisateur introuvable" }, { status: 404 });

    return NextResponse.json({ message: "Adresse mise à jour" });
  } catch (err) {
    console.error("PATCH /api/user/address:", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
