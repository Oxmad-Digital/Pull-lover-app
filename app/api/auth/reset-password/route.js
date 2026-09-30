import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { validatePassword } from "@/app/lib/password";
import { translator } from "@/app/i18n/server";
import { hashToken, TOKEN_PATTERN } from "@/app/lib/tokens";
import { clientIp, rateLimit } from "@/app/lib/rateLimit";

export async function POST(req) {
  let t = translator(req);
  try {
    await connectDB();

    const { token, password, locale } = await req.json();
    t = translator(req, locale);

    // Types stricts : un objet ({"$ne": null}) serait interprété comme opérateur de filtre
    if (typeof token !== "string" || !TOKEN_PATTERN.test(token) || typeof password !== "string") {
      return NextResponse.json({ message: t("Données manquantes ou invalides", "Missing or invalid data") }, { status: 400 });
    }

    const passwordCheck = validatePassword(password, t.lang);
    if (!passwordCheck.isValid) {
      return NextResponse.json(
        { message: t("Mot de passe invalide : ", "Invalid password: ") + passwordCheck.errors.join(", ") },
        { status: 400 }
      );
    }

    const { allowed } = await rateLimit(`reset:${clientIp(req)}`, { limit: 10, windowMs: 15 * 60 * 1000 });
    if (!allowed) {
      return NextResponse.json({ message: t("Trop de tentatives. Réessayez plus tard.", "Too many attempts. Please try again later.") }, { status: 429 });
    }

    const user = await User.findOne({
      resetToken: hashToken(token),
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { message: t("Lien invalide ou expiré. Faites une nouvelle demande.", "Invalid or expired link. Please make a new request.") },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    user.password = hashed;
    // Invalide les sessions ouvertes avec l'ancien mot de passe (voir authOptions)
    user.passwordChangedAt = new Date();
    user.resetToken = null;
    user.resetTokenExpiry = null;
    user.failedLoginAttempts = 0;
    user.accountLockedUntil = null;
    await user.save();

    return NextResponse.json({ message: t("Mot de passe réinitialisé avec succès.", "Password reset successfully.") });
  } catch (error) {
    console.error("❌ Erreur reset-password:", error);
    return NextResponse.json({ message: t("Erreur serveur", "Server error") }, { status: 500 });
  }
}
