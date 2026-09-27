// app/api/upload/delete/route.js
import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/auth";
import { deleteFromR2 } from "@/app/lib/r2";

export async function DELETE(req) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const { key } = await req.json();

    if (!key) {
      return NextResponse.json(
        { message: "Clé R2 manquante" },
        { status: 400 }
      );
    }

    if (!key.startsWith("products/") && !key.startsWith("avatars/")) {
      return NextResponse.json({ message: "Clé R2 non autorisée" }, { status: 400 });
    }

    await deleteFromR2(key);

    return NextResponse.json({
      success: true,
      message: "Image supprimée",
    });

  } catch (error) {
    console.error("❌ Erreur suppression:", error);
    return NextResponse.json(
      { message: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}