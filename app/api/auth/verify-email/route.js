// app/api/auth/verify-email/route.js
import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";
import { NextResponse } from "next/server";
import { translator } from "@/app/i18n/server";
import { hashToken, TOKEN_PATTERN } from "@/app/lib/tokens";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const t = translator(req, searchParams.get("locale"));
  try {
    await connectDB();

    const token = searchParams.get("token");

    if (!token || !TOKEN_PATTERN.test(token)) {
      return NextResponse.json(
        { message: t("Token manquant", "Missing token") },
        { status: 400 }
      );
    }

    // Chercher l'utilisateur avec ce token
    const user = await User.findOne({
      verificationToken: hashToken(token),
      verificationTokenExpiry: { $gt: new Date() }, // Token non expiré
    });

    if (!user) {
      return NextResponse.json(
        { message: t("Token invalide ou expiré", "Invalid or expired token") },
        { status: 400 }
      );
    }

    // ✅ Vérifier l'email
    user.emailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();


    return NextResponse.json(
      { 
        message: t("Email vérifié avec succès ! Vous pouvez maintenant vous connecter.", "Email verified! You can now sign in."),
        verified: true 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("❌ Erreur vérification:", error);
    return NextResponse.json(
      { message: t("Erreur lors de la vérification", "Something went wrong during verification") },
      { status: 500 }
    );
  }
}