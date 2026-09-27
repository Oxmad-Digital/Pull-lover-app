import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { validatePassword } from "@/app/lib/password";

export async function POST(req) {
  try {
    await connectDB();

    const { token, password } = await req.json();

    // Types stricts : un objet ({"$ne": null}) serait interprété comme opérateur de filtre
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token) || typeof password !== "string") {
      return NextResponse.json({ message: "Données manquantes ou invalides" }, { status: 400 });
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.isValid) {
      return NextResponse.json(
        { message: "Mot de passe invalide : " + passwordCheck.errors.join(", ") },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Lien invalide ou expiré. Faites une nouvelle demande." },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    user.password = hashed;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    user.failedLoginAttempts = 0;
    user.accountLockedUntil = null;
    await user.save();

    return NextResponse.json({ message: "Mot de passe réinitialisé avec succès." });
  } catch (error) {
    console.error("❌ Erreur reset-password:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
