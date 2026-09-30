import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";
import bcrypt from "bcryptjs";
import { deleteFromR2 } from "@/app/lib/r2";
import { validatePassword } from "@/app/lib/password";
import { translator } from "@/app/i18n/server";

export async function PATCH(request) {
  const t = translator(request);
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: t("Non autorisé", "Unauthorized") }, { status: 401 });

    const body = await request.json();
    const { name, phone, currentPassword, newPassword, avatar, avatarKey } = body;

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ message: t("Utilisateur introuvable", "User not found") }, { status: 404 });

    if (typeof name === "string" && name.trim()) user.name = name.trim();
    if (typeof phone === "string") user.phone = phone.trim() || null;

    let previousAvatarKey = null;
    // Seules des clés du dossier avatars/ sont acceptées : l'ancienne clé est supprimée de R2 ensuite
    if (avatar !== undefined && session.user.role === "admin" && (avatarKey == null || avatarKey === "" || (typeof avatarKey === "string" && avatarKey.startsWith("avatars/") && !avatarKey.includes("..")))) {
      previousAvatarKey = user.avatarKey;
      user.avatar = avatar || null;
      if (avatarKey !== undefined) user.avatarKey = avatarKey || null;
    }

    if (newPassword) {
      if (typeof currentPassword !== "string" || !currentPassword) {
        return NextResponse.json({ message: t("Mot de passe actuel requis", "Current password is required") }, { status: 400 });
      }
      const valid = user.password ? await bcrypt.compare(currentPassword, user.password) : false;
      if (!valid) {
        return NextResponse.json({ message: t("Mot de passe actuel incorrect", "Current password is incorrect") }, { status: 400 });
      }
      const passwordCheck = validatePassword(newPassword, t.lang);
      if (!passwordCheck.isValid) {
        return NextResponse.json({ message: t("Mot de passe invalide : ", "Invalid password: ") + passwordCheck.errors.join(", ") }, { status: 400 });
      }
      user.password = await bcrypt.hash(newPassword, 12);
      // Déconnecte les autres appareils ; la session courante est rouverte par le client
      user.passwordChangedAt = new Date();
    }

    await user.save();
    if (previousAvatarKey && previousAvatarKey !== user.avatarKey) {
      await deleteFromR2(previousAvatarKey).catch((error) =>
        console.error("Suppression de l’ancien avatar R2 impossible:", error)
      );
    }
    return NextResponse.json({ message: t("Profil mis à jour", "Profile updated") });
  } catch (err) {
    console.error("PATCH /api/user/profile:", err);
    return NextResponse.json({ message: t("Erreur serveur", "Server error") }, { status: 500 });
  }
}
