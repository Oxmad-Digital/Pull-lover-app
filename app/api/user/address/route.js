import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";
import { translator } from "@/app/i18n/server";

export async function PATCH(request) {
  const t = translator(request);
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: t("Non autorisé", "Unauthorized") }, { status: 401 });

    const { street, city, postalCode, country } = await request.json();

    if (!street || !city || !postalCode) {
      return NextResponse.json({ message: t("Rue, ville et code postal sont obligatoires", "Street, city and postcode are required") }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { address: { street: street.trim(), city: city.trim(), postalCode: postalCode.trim(), country: (country || "").trim() } },
      { new: true }
    );

    if (!user) return NextResponse.json({ message: t("Utilisateur introuvable", "User not found") }, { status: 404 });

    return NextResponse.json({ message: t("Adresse mise à jour", "Address updated") });
  } catch (err) {
    console.error("PATCH /api/user/address:", err);
    return NextResponse.json({ message: t("Erreur serveur", "Server error") }, { status: 500 });
  }
}
