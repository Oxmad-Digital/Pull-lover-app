// app/api/upload/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { randomUUID } from "node:crypto";
import { uploadToR2 } from "@/app/lib/r2";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    // 🔒 Vérifier que l'utilisateur est connecté
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: "Non autorisé" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const type = formData.get("type"); // "avatar" ou "product"

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { message: "Accès réservé aux administrateurs" },
        { status: 403 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { message: "Aucun fichier reçu" },
        { status: 400 }
      );
    }

    // ✅ Vérifier le type de fichier
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "Format non autorisé. Utilisez JPG, PNG ou WEBP" },
        { status: 400 }
      );
    }

    // ✅ Vérifier la taille (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: "Fichier trop volumineux. Maximum 5MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const folder = type === "avatar" ? "avatars" : "products";
    const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
    const key = folder + "/" + randomUUID() + "." + extension;
    const result = await uploadToR2({
      key,
      body: buffer,
      contentType: file.type,
    });

    console.log("✅ Image uploadée sur R2: " + result.key);

    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key,
    });

  } catch (error) {
    console.error("❌ Erreur upload:", error);
    return NextResponse.json(
      { message: "Erreur lors de l'upload" },
      { status: 500 }
    );
  }
}