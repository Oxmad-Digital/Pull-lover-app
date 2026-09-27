import { NextResponse } from "next/server";
import { sendEmail } from "@/app/lib/mailer";
import { escapeHtml } from "@/app/lib/text";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req) {
  try {
    const body = await req.json();
    const nom = typeof body.nom === "string" ? body.nom.trim().slice(0, 200) : "";
    const mail = typeof body.mail === "string" ? body.mail.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim().slice(0, 5000) : "";

    if (!nom || !mail || !message) {
      return NextResponse.json({ success: false, message: "Champs manquants" }, { status: 400 });
    }
    if (!EMAIL_REGEX.test(mail)) {
      return NextResponse.json({ success: false, message: "Email invalide" }, { status: 400 });
    }

    await sendEmail({
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      replyTo: mail,
      subject: `Nouveau message de contact — ${nom.replace(/[\r\n]+/g, " ")}`,
      html: `
        <div style="font-family:'Montserrat',sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px">
          <h2 style="margin:0 0 24px;font-size:20px;color:#0f172a">Nouveau message de contact</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:10px 0;font-size:13px;color:#64748b;width:100px">Nom</td>
              <td style="padding:10px 0;font-size:14px;color:#0f172a;font-weight:600">${escapeHtml(nom)}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;font-size:13px;color:#64748b">Email</td>
              <td style="padding:10px 0;font-size:14px;color:#0f172a">
                <a href="mailto:${escapeHtml(mail)}" style="color:#6366f1">${escapeHtml(mail)}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;font-size:13px;color:#64748b;vertical-align:top">Message</td>
              <td style="padding:10px 0;font-size:14px;color:#0f172a;line-height:1.6">${escapeHtml(message).replace(/\n/g, "<br>")}</td>
            </tr>
          </table>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact email error:", error);
    return NextResponse.json({ success: false, message: "Erreur lors de l'envoi du message" }, { status: 500 });
  }
}
