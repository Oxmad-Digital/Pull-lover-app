import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";
import { sendEmail } from "@/app/lib/mailer";
import { getResetPasswordEmailTemplate } from "@/app/lib/emailTemplates";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { translator } from "@/app/i18n/server";
import { localePath } from "@/app/i18n/config.mjs";

export async function POST(req) {
  let t = translator(req);
  try {
    await connectDB();

    const { email, locale } = await req.json();
    t = translator(req, locale);
    const sent = t("Si cette adresse est associée à un compte, vous recevrez un email.", "If this address is linked to an account, you will receive an email.");

    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ message: t("Email requis", "Email is required") }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Réponse identique que l'utilisateur existe ou non (sécurité anti-énumération)
    if (!user) {
      return NextResponse.json({ message: sent });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    user.resetToken = token;
    user.resetTokenExpiry = expiry;
    await user.save();

    const resetUrl = `${process.env.NEXTAUTH_URL}${localePath(t.lang, "/auth/reset-password")}?token=${token}`;

    // Échec d'envoi silencieux côté client : une erreur ici révélerait que le compte existe
    try {
      await sendEmail({
        to: user.email,
        subject: t("Réinitialisation de votre mot de passe — Pull-Lover", "Reset your password — Pull-Lover"),
        html: getResetPasswordEmailTemplate(user.name, resetUrl, t.lang),
      });
    } catch (emailError) {
      console.error("❌ Email reset mot de passe:", emailError.message);
    }

    return NextResponse.json({ message: sent });
  } catch (error) {
    console.error("❌ Erreur forgot-password:", error);
    return NextResponse.json({ message: t("Erreur serveur", "Server error") }, { status: 500 });
  }
}
