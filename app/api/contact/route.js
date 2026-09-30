import { NextResponse } from "next/server";
import { CONTACT_SUBJECTS, normalizeContactPayload, validateContactPayload } from "@/app/lib/contact.mjs";
import { sendEmail, adminEmail } from "@/app/lib/mailer";
import { getContactEmailTemplate } from "@/app/lib/emailTemplates";
import { translator } from "@/app/i18n/server";
import { clientIp, rateLimit } from "@/app/lib/rateLimit";

export const runtime = "nodejs";
const WINDOW_MS = 10 * 60 * 1000;

async function isRateLimited(request) {
  const { allowed } = await rateLimit(`contact:${clientIp(request)}`, { limit: 5, windowMs: WINDOW_MS });
  return !allowed;
}

export async function POST(request) {
  let t = translator(request);
  try {
    if (await isRateLimited(request)) return NextResponse.json({ message: t("Trop de tentatives. Merci de réessayer dans quelques minutes.", "Too many attempts. Please try again in a few minutes.") }, { status: 429 });
    const body = await request.json();
    t = translator(request, body?.locale);
    const sent = t("Votre message a bien été envoyé.", "Your message has been sent.");
    const failed = t("L’envoi a échoué. Merci de réessayer dans un instant.", "Sending failed. Please try again in a moment.");
    const payload = normalizeContactPayload(body);
    if (payload.website) return NextResponse.json({ message: sent });
    const validationError = validateContactPayload(payload, t.lang);
    if (validationError) return NextResponse.json({ message: validationError }, { status: 400 });

    const recipient = process.env.CONTACT_EMAIL || adminEmail();
    if (!process.env.PLUNK_SECRET_KEY || !process.env.PLUNK_FROM_EMAIL || !recipient) {
      console.error("CONTACT CONFIG ERROR: configuration Plunk incomplète");
      return NextResponse.json({ message: t("Le service de messagerie est momentanément indisponible.", "The messaging service is temporarily unavailable.") }, { status: 503 });
    }
    const senderName = `${payload.firstName} ${payload.lastName}`.replace(/[\r\n]+/g, " ");

    try {
      await sendEmail({
        to: recipient,
        replyTo: payload.email,
        subject: `[Contact] ${CONTACT_SUBJECTS[payload.subject]} — ${senderName}`,
        html: getContactEmailTemplate({ ...payload, subjectLabel: CONTACT_SUBJECTS[payload.subject], lang: t.lang }),
      });
    } catch (error) {
      console.error("PLUNK CONTACT ERROR:", error.message);
      return NextResponse.json({ message: failed }, { status: 502 });
    }
    return NextResponse.json({ message: sent });
  } catch (error) {
    console.error("CONTACT ERROR:", error?.name || "Error", error?.message || "Erreur inconnue");
    return NextResponse.json({ message: t("L’envoi a échoué. Merci de réessayer dans un instant.", "Sending failed. Please try again in a moment.") }, { status: 500 });
  }
}

