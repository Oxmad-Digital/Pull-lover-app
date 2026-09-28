import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { CONTACT_SUBJECTS, escapeHtml, normalizeContactPayload, validateContactPayload } from "@/app/lib/contact.mjs";

export const runtime = "nodejs";
const PLUNK_ENDPOINT = "https://next-api.useplunk.com/v1/send";
const WINDOW_MS = 10 * 60 * 1000;
const attempts = new Map();

function isRateLimited(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter((time) => now - time < WINDOW_MS);
  recent.push(now);
  attempts.set(ip, recent);
  if (attempts.size > 500) for (const [key, values] of attempts) if (!values.some((time) => now - time < WINDOW_MS)) attempts.delete(key);
  return recent.length > 5;
}

function emailBody(payload) {
  const safe = Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, escapeHtml(value)]));
  const order = payload.orderNumber ? `<tr><td style="padding:8px 16px 8px 0;color:#706666">Commande</td><td style="padding:8px 0;font-weight:600">${safe.orderNumber}</td></tr>` : "";
  return `<div style="margin:0;background:#fff9f6;padding:32px 16px;font-family:Arial,sans-serif;color:#243b3b"><div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e8dad6"><div style="padding:28px 32px;background:#243b3b;color:#fff"><p style="margin:0 0 8px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#f2c1bd">Nouveau message</p><h1 style="margin:0;font:normal 32px Georgia,serif">Contact Pull-Lover</h1></div><div style="padding:32px"><table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px"><tr><td style="padding:8px 16px 8px 0;color:#706666">De</td><td style="padding:8px 0;font-weight:600">${safe.firstName} ${safe.lastName}</td></tr><tr><td style="padding:8px 16px 8px 0;color:#706666">E-mail</td><td style="padding:8px 0"><a href="mailto:${safe.email}" style="color:#ad4646">${safe.email}</a></td></tr><tr><td style="padding:8px 16px 8px 0;color:#706666">Sujet</td><td style="padding:8px 0">${escapeHtml(CONTACT_SUBJECTS[payload.subject])}</td></tr>${order}</table><div style="margin-top:28px;padding-top:24px;border-top:1px solid #e8dad6;font-size:16px;line-height:1.7;color:#252323">${safe.message.replaceAll("\n", "<br>")}</div></div></div></div>`;
}

export async function POST(request) {
  try {
    if (isRateLimited(request)) return NextResponse.json({ message: "Trop de tentatives. Merci de réessayer dans quelques minutes." }, { status: 429 });
    const payload = normalizeContactPayload(await request.json());
    if (payload.website) return NextResponse.json({ message: "Votre message a bien été envoyé." });
    const validationError = validateContactPayload(payload);
    if (validationError) return NextResponse.json({ message: validationError }, { status: 400 });

    const secretKey = process.env.PLUNK_SECRET_KEY;
    const fromEmail = process.env.PLUNK_FROM_EMAIL;
    const recipient = process.env.CONTACT_EMAIL || process.env.ADMIN_EMAIL || fromEmail;
    if (!secretKey || !fromEmail || !recipient) {
      console.error("CONTACT CONFIG ERROR: configuration Plunk incomplète");
      return NextResponse.json({ message: "Le service de messagerie est momentanément indisponible." }, { status: 503 });
    }
    const senderName = `${payload.firstName} ${payload.lastName}`.replace(/[\r\n]+/g, " ");

    const response = await fetch(PLUNK_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json", "Idempotency-Key": randomUUID() },
      body: JSON.stringify({
        to: recipient,
        from: { name: process.env.PLUNK_FROM_NAME || "Pull-Lover", email: fromEmail },
        reply: payload.email,
        subject: `[Contact] ${CONTACT_SUBJECTS[payload.subject]} — ${senderName}`,
        body: emailBody(payload),
      }),
      signal: AbortSignal.timeout(10000),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
      console.error("PLUNK CONTACT ERROR:", response.status, result?.error?.code || "UNKNOWN_ERROR");
      return NextResponse.json({ message: "L’envoi a échoué. Merci de réessayer dans un instant." }, { status: 502 });
    }
    return NextResponse.json({ message: "Votre message a bien été envoyé." });
  } catch (error) {
    console.error("CONTACT ERROR:", error?.name || "Error", error?.message || "Erreur inconnue");
    return NextResponse.json({ message: "L’envoi a échoué. Merci de réessayer dans un instant." }, { status: 500 });
  }
}

