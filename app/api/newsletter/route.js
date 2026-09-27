import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import NewsletterSubscriber from "@/app/models/NewsletterSubscriber";
import { sendEmail } from "@/app/lib/mailer";
import { escapeHtml } from "@/app/lib/text";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    await connectDB();

    const existing = await NewsletterSubscriber.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: "Cet email est déjà inscrit" }, { status: 409 });
    }

    await NewsletterSubscriber.create({ email });

    // Notification admin
    await sendEmail({
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: "Nouvel abonné newsletter — Pull-Lover",
      html: `
        <div style="font-family: Montserrat, sans-serif; padding: 24px; max-width: 480px;">
          <h2 style="color: #C95D5D;">Nouveau abonné newsletter</h2>
          <p><strong>Email :</strong> ${escapeHtml(email)}</p>
          <p style="color: #888; font-size: 13px;">Inscrit le ${new Date().toLocaleDateString("fr-FR", { dateStyle: "long" })}</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Newsletter error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
