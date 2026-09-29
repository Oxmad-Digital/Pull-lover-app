// app/lib/mailer.js
// Envoi des e-mails via l'API Plunk (https://useplunk.com). Remplace l'ancien SMTP Nodemailer.

import { randomUUID } from "crypto";
import { localePath } from "@/app/i18n/config.mjs";

const PLUNK_ENDPOINT = "https://next-api.useplunk.com/v1/send";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Destinataire des notifications internes (nouvelle commande, alertes, contact). */
export function adminEmail() {
  return process.env.ADMIN_EMAIL || process.env.CONTACT_EMAIL || process.env.PLUNK_FROM_EMAIL;
}

/** URL publique du site, sans slash final. */
export function siteUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "").replace(/\/$/, "");
}

/** Lien vers « Mes commandes » dans la langue du client. */
export function ordersPageUrl(lang) {
  return `${siteUrl()}${localePath(lang, "/dashboard/orders")}`;
}

/**
 * Envoie un e-mail HTML via Plunk. Lève une erreur si la configuration est incomplète
 * ou si Plunk refuse l'envoi : aux appelants de décider si l'échec est bloquant.
 * @param {Object} options - { to, subject, html, replyTo? }
 */
export async function sendEmail({ to, subject, html, replyTo }) {
  const secretKey = process.env.PLUNK_SECRET_KEY;
  const fromEmail = process.env.PLUNK_FROM_EMAIL;
  if (!secretKey || !fromEmail) throw new Error("Configuration Plunk incomplète (PLUNK_SECRET_KEY / PLUNK_FROM_EMAIL)");

  const recipient = typeof to === "string" ? to.trim().toLowerCase() : "";
  if (!recipient) throw new Error("Destinataire email manquant");
  if (!EMAIL_PATTERN.test(recipient)) throw new Error(`Format email invalide: ${recipient}`);

  const payload = {
    to: recipient,
    from: { name: process.env.PLUNK_FROM_NAME || "Pull-Lover", email: fromEmail },
    subject: String(subject).replace(/[\r\n]+/g, " "),
    body: html,
  };
  const reply = replyTo || process.env.CONTACT_EMAIL;
  if (reply) payload.reply = reply;

  const response = await fetch(PLUNK_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json", "Idempotency-Key": randomUUID() },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) {
    throw new Error(`Plunk a refusé l'envoi (${response.status} ${result?.error?.code || "UNKNOWN_ERROR"})`);
  }

  return { success: true, to: recipient };
}
