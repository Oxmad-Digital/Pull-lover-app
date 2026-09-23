import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";
import bcrypt from "bcryptjs";
import { deleteFromR2 } from "@/app/lib/r2";

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });

    const body = await request.json();
    const { name, phone, currentPassword, newPassword, avatar, avatarKey } = body;

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ message: "Utilisateur introuvable" }, { status: 404 });

    if (name?.trim()) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim() || null;

    let previousAvatarKey = null;
    if (avatar !== undefined && session.user.role === "admin") {
      previousAvatarKey = user.avatarKey;
      user.avatar = avatar || null;
      if (avatarKey !== undefined) user.avatarKey = avatarKey || null;
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ message: "Mot de passe actuel requis" }, { status: 400 });
      }
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return NextResponse.json({ message: "Mot de passe actuel incorrect" }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ message: "Le nouveau mot de passe doit faire au moins 6 caractères" }, { status: 400 });
      }
      user.password = await bcrypt.hash(newPassword, 12);
    }

    await user.save();
    if (previousAvatarKey && previousAvatarKey !== user.avatarKey) {
      await deleteFromR2(previousAvatarKey).catch((error) =>
        console.error("Suppression de l’ancien avatar R2 impossible:", error)
      );
    }
    return NextResponse.json({ message: "Profil mis à jour" });
  } catch (err) {
    console.error("PATCH /api/user/profile:", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
