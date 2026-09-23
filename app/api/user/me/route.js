import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });

    await connectDB();
    const user = await User.findOne({ email: session.user.email })
      .select("name email phone address avatar avatarKey")
      .lean();

    if (!user) return NextResponse.json({ message: "Introuvable" }, { status: 404 });

    return NextResponse.json(user);
  } catch (err) {
    console.error("GET /api/user/me:", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
