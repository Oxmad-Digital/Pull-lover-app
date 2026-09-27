import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";
import { sendEmail } from "@/app/lib/mailer";
import { getResetPasswordEmailTemplate } from "@/app/lib/emailTemplates";
import crypto from "crypto";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectDB();

    const { email } = await req.json();

    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ message: "Email requis" }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Réponse identique que l'utilisateur existe ou non (sécurité anti-énumération)
    if (!user) {
      return NextResponse.json({
        message: "Si cette adresse est associée à un compte, vous recevrez un email.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    user.resetToken = token;
    user.resetTokenExpiry = expiry;
    await user.save();

    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: "Réinitialisation de votre mot de passe — Pull-Lover",
      html: getResetPasswordEmailTemplate(user.name, resetUrl),
    });

    return NextResponse.json({
      message: "Si cette adresse est associée à un compte, vous recevrez un email.",
    });
  } catch (error) {
    console.error("❌ Erreur forgot-password:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
