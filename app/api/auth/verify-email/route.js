// app/api/auth/verify-email/route.js
import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
      return NextResponse.json(
        { message: "Token manquant" },
        { status: 400 }
      );
    }

    // Chercher l'utilisateur avec ce token
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() }, // Token non expiré
    });

    if (!user) {
      return NextResponse.json(
        { message: "Token invalide ou expiré" },
        { status: 400 }
      );
    }

    // ✅ Vérifier l'email
    user.emailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    console.log(`✅ Email vérifié: ${user.email}`);

    return NextResponse.json(
      { 
        message: "Email vérifié avec succès ! Vous pouvez maintenant vous connecter.",
        verified: true 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("❌ Erreur vérification:", error);
    return NextResponse.json(
      { message: "Erreur lors de la vérification" },
      { status: 500 }
    );
  }
}