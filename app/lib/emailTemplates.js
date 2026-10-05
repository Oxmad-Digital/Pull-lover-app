// app/lib/emailTemplates.js
// Tous les templates e-mail Pull-Lover — charte du site (vert #243b3b, corail #c75c5c, papier #fff9f6, titres Georgia)

import { escapeHtml } from "./text.js";
import { INTL_LOCALE, toLocale } from "../i18n/config.mjs";

// Textes des e-mails envoyés au client, dans la langue de sa commande / de son inscription.
// L'e-mail « nouvelle commande » destiné à l'admin reste en français.
const TEXT = {
  fr: {
    rights: "Tous droits réservés",
    auto: "Email envoyé automatiquement suite à votre activité sur pull-lover",
    copyLink: "Ou copiez ce lien dans votre navigateur :",
    welcome: (name) => `Bienvenue, ${name} !`,
    verifyIntro: "Merci de rejoindre la communauté Pull-Lover.<br>Confirmez votre adresse email pour activer votre compte.",
    verifyCta: "Vérifier mon adresse email",
    verifyExpiry: "<strong>Ce lien expire dans 24 heures.</strong> Si vous ne l'utilisez pas à temps, demandez-en un nouveau depuis la page de connexion.",
    verifyIgnore: "Vous n'avez pas créé ce compte ? Ignorez simplement cet email.",
    verifyTitle: "Vérification de votre email — Pull-Lover",
    verifyPreheader: (name) => `Bonjour ${name}, confirmez votre email pour activer votre compte Pull-Lover.`,
    resetHeading: "Réinitialisation de mot de passe",
    resetIntro: (name) => `Bonjour ${name},<br><br>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.`,
    resetCta: "Réinitialiser mon mot de passe",
    resetExpiry: "<strong>Ce lien expire dans 1 heure.</strong> Passé ce délai, vous devrez faire une nouvelle demande.",
    resetIgnore: "Vous n'avez pas fait cette demande ? Ignorez cet email, votre mot de passe reste inchangé.",
    resetTitle: "Réinitialisation de mot de passe — Pull-Lover",
    resetPreheader: (name) => `Bonjour ${name}, réinitialisez votre mot de passe Pull-Lover.`,
    orderConfirmed: "Commande confirmée",
    thanks: (name) => `Merci, ${name} !`,
    orderReceived: "Votre commande a bien été reçue et est en cours de traitement.",
    orderNumber: "Numéro de commande",
    date: "Date",
    itemsOrdered: "Articles commandés",
    product: "Produit",
    qty: "Qté",
    price: "Prix",
    total: "Total",
    deliveryDetails: "Détails de livraison",
    address: "Adresse :",
    delivery: "Livraison :",
    payment: "Paiement :",
    viewOrder: "Voir ma commande",
    question: "Une question ? Répondez directement à cet email, nous vous répondrons dans les plus brefs délais.",
    confirmationTitle: (number) => `Confirmation de votre commande #${number}`,
    confirmationPreheader: (name, number) => `Merci ${name} ! Votre commande #${number} a bien été confirmée.`,
    orderUpdate: "Mise à jour de commande",
    hello: (name) => `Bonjour ${name},`,
    trackingNumber: "Numéro de suivi",
    trackParcel: "Suivre mon colis →",
    summary: "Récapitulatif",
    order: "Commande",
    shippingAddress: "Adresse de livraison",
    replyQuestion: "Pour toute question, répondez directement à cet email.",
    size: "Taille :",
    unknownProduct: "Produit",
  },
  en: {
    rights: "All rights reserved",
    auto: "This email was sent automatically following your activity on pull-lover",
    copyLink: "Or copy this link into your browser:",
    welcome: (name) => `Welcome, ${name}!`,
    verifyIntro: "Thank you for joining the Pull-Lover community.<br>Confirm your email address to activate your account.",
    verifyCta: "Verify my email address",
    verifyExpiry: "<strong>This link expires in 24 hours.</strong> If you don't use it in time, request a new one from the sign-in page.",
    verifyIgnore: "Didn't create this account? Simply ignore this email.",
    verifyTitle: "Verify your email — Pull-Lover",
    verifyPreheader: (name) => `Hello ${name}, confirm your email to activate your Pull-Lover account.`,
    resetHeading: "Password reset",
    resetIntro: (name) => `Hello ${name},<br><br>You asked to reset your password. Click the button below to choose a new one.`,
    resetCta: "Reset my password",
    resetExpiry: "<strong>This link expires in 1 hour.</strong> After that, you'll need to make a new request.",
    resetIgnore: "Didn't request this? Ignore this email, your password stays the same.",
    resetTitle: "Password reset — Pull-Lover",
    resetPreheader: (name) => `Hello ${name}, reset your Pull-Lover password.`,
    orderConfirmed: "Order confirmed",
    thanks: (name) => `Thank you, ${name}!`,
    orderReceived: "Your order has been received and is being processed.",
    orderNumber: "Order number",
    date: "Date",
    itemsOrdered: "Items ordered",
    product: "Product",
    qty: "Qty",
    price: "Price",
    total: "Total",
    deliveryDetails: "Delivery details",
    address: "Address:",
    delivery: "Delivery:",
    payment: "Payment:",
    viewOrder: "View my order",
    question: "Any questions? Just reply to this email and we'll get back to you as soon as possible.",
    confirmationTitle: (number) => `Your order confirmation #${number}`,
    confirmationPreheader: (name, number) => `Thank you ${name}! Your order #${number} has been confirmed.`,
    orderUpdate: "Order update",
    hello: (name) => `Hello ${name},`,
    trackingNumber: "Tracking number",
    trackParcel: "Track my parcel →",
    summary: "Summary",
    order: "Order",
    shippingAddress: "Shipping address",
    replyQuestion: "If you have any questions, just reply to this email.",
    size: "Size:",
    unknownProduct: "Product",
  },
};

const textFor = (lang) => TEXT[toLocale(lang)];

/** Montant affiché dans un e-mail : "120 €" / "€120". */
export function emailMoney(value, lang = "fr") {
  const amount = Number(value || 0);
  return new Intl.NumberFormat(INTL_LOCALE[toLocale(lang)], {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ── Charte (alignée sur app/globals.css) ────────────────────────────────────
const ink = "#243b3b";       // --color-primary
const accent = "#c75c5c";    // --color-secondary
const accentDark = "#ad4646"; // --color-secondary-hover (boutons et liens : contraste AA)
const paper = "#fff9f6";     // --color-background
const mist = "#f3eae7";      // --pl-mist
const line = "#e8dad6";      // --color-border
const text = "#252323";      // --color-text
const muted = "#706666";     // --color-text-muted
const serif = "Georgia,'Times New Roman',serif";
const sans = "Arial,Helvetica,sans-serif";

const stripTags = (html) => String(html ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

/**
 * Lignes <tr> des articles d'une commande (confirmation client, renvoi, notification admin).
 * @param {Array<{ name: string, image?: string, size?: string, quantity: number, unitPrice?: number }>} items
 */
export function orderItemsHtml(items, lang = "fr") {
  const t = textFor(lang);
  return items.map((item) => `
      <tr style="border-bottom:1px solid ${line}">
        <td style="padding:14px 8px 14px 0;vertical-align:top">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              ${item.image ? `<td style="padding-right:12px;vertical-align:top">
                <img src="${escapeHtml(item.image)}" width="48" height="60" alt="${escapeHtml(item.name)}" style="display:block;object-fit:cover;border:1px solid ${line}">
              </td>` : ""}
              <td style="vertical-align:top">
                <p style="margin:0;font:600 14px ${sans};color:${text}">${escapeHtml(item.name || t.unknownProduct)}</p>
                ${item.size ? `<p style="margin:3px 0 0;font:12px ${sans};color:${muted}">${t.size} ${escapeHtml(item.size)}</p>` : ""}
              </td>
            </tr>
          </table>
        </td>
        <td style="padding:14px 0;font:14px ${sans};color:${text};text-align:center;vertical-align:top">${Number(item.quantity) || 1}</td>
        <td style="padding:14px 0;font:600 14px ${sans};color:${text};text-align:right;vertical-align:top">${item.unitPrice != null ? emailMoney(item.unitPrice, lang) : "-"}</td>
      </tr>
    `).join("");
}

// Les clients mail n'affichent que des images en URL absolue : logo servi depuis R2 (email/)
const logoUrl = () => `${(process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://pull-lover.com").replace(/\/$/, "")}/api/media/email/logo-coeur.png`;

function logoHtml(size = 26) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr>
            <td style="padding-right:12px;vertical-align:middle"><img src="${logoUrl()}" width="44" alt="" style="display:block;width:44px;height:auto;border:0"></td>
            <td style="vertical-align:middle"><span style="font-family:${serif};font-size:${size}px;color:#ffffff;letter-spacing:.01em">Pull<span style="color:#f2c1bd">·</span>Lover</span></td>
          </tr></table>`;
}

function eyebrow(label, color = accent) {
  return `<p style="margin:0 0 10px;font:700 11px ${sans};letter-spacing:.12em;text-transform:uppercase;color:${color}">${label}</p>`;
}

function heading(label) {
  return `<h1 class="email-h1" style="margin:0 0 14px;font:normal 30px/1.2 ${serif};color:${ink}">${label}</h1>`;
}

function sectionLabel(label) {
  return `<p style="margin:0 0 10px;font:700 11px ${sans};letter-spacing:.12em;text-transform:uppercase;color:${muted}">${label}</p>`;
}

/** Bloc encadré sur fond papier. */
function panel(inner, { background = paper, border = line } = {}) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:${background};border:1px solid ${border};padding:18px 20px">${inner}</td></tr></table>`;
}

// Bouton CTA générique
function ctaButton(url, label) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto">
      <tr><td style="background:${accentDark}">
        <a href="${url}" style="display:inline-block;padding:15px 38px;color:#fff;text-decoration:none;font:700 14px ${sans};letter-spacing:.06em;text-transform:uppercase">${label}</a>
      </td></tr>
    </table>`;
}

/** Bouton centré dans sa propre ligne, avec l'espacement standard. */
function ctaRow(url, label, marginBottom = 32) {
  return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:${marginBottom}px">
        <tr><td align="center">${ctaButton(url, label)}</td></tr>
      </table>`;
}

/** Lien avec repli « copiez ce lien » (vérification, réinitialisation). */
function fallbackLink(url, t) {
  return `
      <p style="margin:0 0 6px;font:13px ${sans};color:${muted}">${t.copyLink}</p>
      <p style="margin:0 0 28px;font:12px ${sans};color:${accentDark};word-break:break-all">${url}</p>`;
}

/** Encart d'avertissement (expiration d'un lien). */
function noticeBox(inner) {
  return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
        <tr><td style="background:${mist};border-left:3px solid ${accent};padding:16px 18px">
          <p style="margin:0;font:14px/1.6 ${sans};color:${ink}">${inner}</p>
        </td></tr>
      </table>`;
}

function wrap(title, preheader, bodyRows, lang = "fr") {
  const t = textFor(lang);
  return `<!DOCTYPE html>
<html lang="${toLocale(lang)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${stripTags(title)}</title>
  <style>
    @media only screen and (max-width: 600px) {
      .ep-header  { padding: 22px 20px !important; }
      .ep-body    { padding: 28px 20px !important; }
      .ep-section { padding: 28px 20px 0 !important; }
      .ep-last    { padding: 0 20px 28px !important; }
      .ep-footer  { padding: 24px 20px !important; }
      .ep-banner  { padding: 24px 20px !important; }
      h1.email-h1 { font-size: 24px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${paper};font-family:${sans};color:${text}">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:${paper}">${stripTags(preheader)}&nbsp;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${paper};padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border:1px solid ${line}">

        <tr><td class="ep-header" style="padding:28px 40px;background:${ink};text-align:center;border-bottom:3px solid ${accent}">
          ${logoHtml()}
        </td></tr>

        ${bodyRows}

        <tr><td class="ep-footer" style="background:${mist};padding:26px 40px;text-align:center;border-top:1px solid ${line}">
          <p style="margin:0 0 8px;font:normal 16px ${serif};color:${ink}">Pull<span style="color:${accent}">·</span>Lover</p>
          <p style="margin:0;font:12px ${sans};color:${muted}">© ${new Date().getFullYear()} Pull-Lover — ${t.rights}</p>
          <p style="margin:6px 0 0;font:11px ${sans};color:${muted}">${t.auto}</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── 1. Email de vérification ────────────────────────────────────────────────

export function getVerificationEmailTemplate(name, verificationUrl, lang = "fr") {
  const t = textFor(lang);
  name = escapeHtml(name);
  const body = `
    <tr><td class="ep-body" style="padding:40px">
      ${heading(t.welcome(name))}
      <p style="margin:0 0 28px;font:15px/1.7 ${sans};color:${text}">${t.verifyIntro}</p>
      ${ctaRow(verificationUrl, t.verifyCta)}
      ${fallbackLink(verificationUrl, t)}
      ${noticeBox(`⏱ ${t.verifyExpiry}`)}
      <p style="margin:0;font:13px ${sans};color:${muted}">${t.verifyIgnore}</p>
    </td></tr>
  `;
  return wrap(t.verifyTitle, t.verifyPreheader(name), body, lang);
}

// ── 2. Réinitialisation de mot de passe ────────────────────────────────────

export function getResetPasswordEmailTemplate(name, resetUrl, lang = "fr") {
  const t = textFor(lang);
  name = escapeHtml(name);
  const body = `
    <tr><td class="ep-body" style="padding:40px">
      ${heading(t.resetHeading)}
      <p style="margin:0 0 28px;font:15px/1.7 ${sans};color:${text}">${t.resetIntro(name)}</p>
      ${ctaRow(resetUrl, t.resetCta)}
      ${fallbackLink(resetUrl, t)}
      ${noticeBox(`⏱ ${t.resetExpiry}`)}
      <p style="margin:0;font:13px ${sans};color:${muted}">${t.resetIgnore}</p>
    </td></tr>
  `;
  return wrap(t.resetTitle, t.resetPreheader(name), body, lang);
}

// ── 3. Confirmation de commande (client) ────────────────────────────────────

function orderTable({ t, productListHtml, total, lang, totalSize = 20 }) {
  const th = `padding:10px 0;font:700 11px ${sans};color:${muted};text-transform:uppercase;letter-spacing:.08em`;
  return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;border-collapse:collapse">
        <thead>
          <tr style="border-bottom:2px solid ${ink}">
            <th style="${th};text-align:left">${t.product}</th>
            <th style="${th};text-align:center;width:40px">${t.qty}</th>
            <th style="${th};text-align:right">${t.price}</th>
          </tr>
        </thead>
        <tbody>${productListHtml}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:16px 0;font:700 14px ${sans};color:${ink}">${t.total}</td>
            <td style="padding:16px 0;text-align:right;font:normal ${totalSize}px ${serif};color:${ink}">${emailMoney(total, lang)}</td>
          </tr>
        </tfoot>
      </table>`;
}

export function getOrderConfirmationEmailTemplate({
  firstname,
  orderNumber,
  orderDate,
  productListHtml,
  address,
  city,
  deliveryLabel,
  paymentLabel,
  total,
  orderUrl,
  lang = "fr",
}) {
  const t = textFor(lang);
  // Données saisies par le client : échappées avant insertion dans le HTML
  [firstname, address, city, deliveryLabel, paymentLabel] = [firstname, address, city, deliveryLabel, paymentLabel].map(escapeHtml);
  const body = `
    <tr><td class="ep-banner" style="background:${paper};padding:36px 40px 30px;text-align:center;border-bottom:1px solid ${line}">
      ${eyebrow(t.orderConfirmed)}
      ${heading(t.thanks(firstname))}
      <p style="margin:0;font:14px/1.6 ${sans};color:${muted}">${t.orderReceived}</p>
    </td></tr>

    <tr><td class="ep-section" style="padding:28px 40px 0">

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
        <tr><td style="background:${paper};border:1px solid ${line};padding:16px 20px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                ${sectionLabel(t.orderNumber)}
                <p style="margin:0;font:normal 22px ${serif};color:${accentDark};letter-spacing:.04em">#${orderNumber}</p>
              </td>
              <td style="text-align:right;vertical-align:top">
                ${sectionLabel(t.date)}
                <p style="margin:0;font:600 13px ${sans};color:${text}">${orderDate}</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>

      ${sectionLabel(t.itemsOrdered)}
      ${orderTable({ t, productListHtml, total, lang })}

      ${sectionLabel(t.deliveryDetails)}
      <div style="margin-bottom:32px">${panel(`
          <p style="margin:0 0 10px;font:14px/1.5 ${sans};color:${text}"><strong>${t.address}</strong> ${address}, ${city}</p>
          <p style="margin:0 0 10px;font:14px/1.5 ${sans};color:${text}"><strong>${t.delivery}</strong> ${deliveryLabel}</p>
          <p style="margin:0;font:14px/1.5 ${sans};color:${text}"><strong>${t.payment}</strong> ${paymentLabel}</p>`)}</div>

      ${orderUrl ? ctaRow(orderUrl, t.viewOrder) : ""}

      <p style="margin:0 0 36px;font:13px/1.6 ${sans};color:${muted}">${t.question}</p>
    </td></tr>
  `;
  return wrap(t.confirmationTitle(orderNumber), t.confirmationPreheader(firstname, orderNumber), body, lang);
}

// ── 4. Notification nouvelle commande (admin, en français) ──────────────────

export function getAdminNewOrderEmailTemplate({
  firstname,
  lastname,
  email,
  phone,
  orderNumber,
  orderDate,
  productListHtml,
  address,
  city,
  deliveryLabel,
  paymentLabel,
  total,
  notice = "",
}) {
  const t = textFor("fr");
  // Données saisies par le client : échappées avant insertion dans le HTML
  [firstname, lastname, email, phone, address, city, deliveryLabel, paymentLabel] =
    [firstname, lastname, email, phone, address, city, deliveryLabel, paymentLabel].map(escapeHtml);
  const body = `
    <tr><td class="ep-banner" style="background:${paper};padding:32px 40px 26px;text-align:center;border-bottom:1px solid ${line}">
      ${eyebrow("Nouvelle commande reçue")}
      ${heading(`Commande #${orderNumber}`)}
      <p style="margin:0;font:13px ${sans};color:${muted}">${orderDate}</p>
    </td></tr>

    <tr><td class="ep-section" style="padding:28px 40px 0">

      ${notice ? `<div style="margin-bottom:24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:#fbeaea;border-left:3px solid #be123c;padding:14px 18px;font:14px/1.6 ${sans};color:#7f1d1d">${notice}</td></tr></table></div>` : ""}

      ${sectionLabel("Client")}
      <div style="margin-bottom:24px">${panel(`
          <p style="margin:0 0 8px;font:normal 20px ${serif};color:${ink}">${firstname} ${lastname}</p>
          <p style="margin:0 0 6px;font:14px ${sans};color:${muted}">📧 <a href="mailto:${email}" style="color:${accentDark};text-decoration:none">${email}</a></p>
          <p style="margin:0 0 6px;font:14px ${sans};color:${muted}">📞 ${phone || "Non renseigné"}</p>
          <p style="margin:0;font:14px ${sans};color:${muted}">📍 ${address}, ${city}</p>`)}</div>

      ${sectionLabel("Articles commandés")}
      ${orderTable({ t, productListHtml, total, lang: "fr", totalSize: 22 })}

      ${sectionLabel("Détails")}
      <div style="margin-bottom:36px">${panel(`
          <p style="margin:0 0 8px;font:14px ${sans};color:${text}"><strong>Livraison :</strong> ${deliveryLabel}</p>
          <p style="margin:0;font:14px ${sans};color:${text}"><strong>Paiement :</strong> ${paymentLabel}</p>`)}</div>

    </td></tr>
  `;
  return wrap(
    `Nouvelle commande #${orderNumber} — Admin`,
    `Nouvelle commande de ${firstname} ${lastname} — Total : ${emailMoney(total)}`,
    body
  );
}

// ── 5. Mise à jour du statut de commande (client) ──────────────────────────

export function getOrderStatusUpdateEmailTemplate({
  firstname,
  orderNumber,
  statusInfo,
  statusMessage,
  address,
  city,
  total,
  orderUrl,
  trackingNumber,
  trackingUrl,
  lang = "fr",
}) {
  const t = textFor(lang);
  // statusMessage contient du HTML volontaire (généré côté serveur) ; le reste est échappé
  [firstname, address, city] = [firstname, address, city].map(escapeHtml);
  trackingNumber = trackingNumber ? escapeHtml(trackingNumber) : trackingNumber;
  trackingUrl = /^https?:\/\//i.test(trackingUrl || "") ? escapeHtml(trackingUrl) : null;
  const body = `
    <tr><td class="ep-body" style="padding:40px 40px 0;text-align:center">
      ${eyebrow(t.orderUpdate)}
      ${heading(t.hello(firstname))}

      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 22px">
        <tr><td style="background:${paper};border:1px solid ${line};border-left:4px solid ${statusInfo.color};padding:10px 24px">
          <span style="font-size:18px">${statusInfo.icon}</span>
          <span style="margin-left:8px;font:700 15px ${sans};color:${ink};vertical-align:middle">${statusInfo.label}</span>
        </td></tr>
      </table>

      <p style="margin:0 0 28px;font:15px/1.7 ${sans};color:${text}">${statusMessage}</p>

      ${trackingNumber ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
        <tr><td style="background:${mist};border:1px solid ${line};padding:18px 20px;text-align:center">
          ${sectionLabel(t.trackingNumber)}
          <p style="margin:0 0 ${trackingUrl ? 14 : 0}px;font:normal 22px ${serif};color:${ink};letter-spacing:.08em">${trackingNumber}</p>
          ${trackingUrl ? `<a href="${trackingUrl}" style="display:inline-block;padding:10px 22px;background:${ink};color:#fff;text-decoration:none;font:700 12px ${sans};letter-spacing:.08em;text-transform:uppercase">${t.trackParcel}</a>` : ""}
        </td></tr>
      </table>` : ""}

      ${orderUrl ? ctaRow(orderUrl, t.viewOrder, 36) : `<div style="margin-bottom:36px"></div>`}
    </td></tr>

    <tr><td class="ep-last" style="padding:0 40px 36px">
      ${sectionLabel(t.summary)}
      ${panel(`
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:0 0 14px">
              ${sectionLabel(t.order)}
              <p style="margin:0;font:normal 20px ${serif};color:${accentDark}">#${orderNumber}</p>
            </td></tr>
            <tr><td style="padding:0 0 14px">
              ${sectionLabel(t.shippingAddress)}
              <p style="margin:0;font:600 14px ${sans};color:${text}">${address}, ${city}</p>
            </td></tr>
            <tr><td>
              ${sectionLabel(t.total)}
              <p style="margin:0;font:normal 18px ${serif};color:${ink}">${emailMoney(total, lang)}</p>
            </td></tr>
          </table>`)}

      <p style="margin:20px 0 0;font:13px/1.6 ${sans};color:${muted}">${t.replyQuestion}</p>
    </td></tr>
  `;
  return wrap(
    `${t.order} #${orderNumber} — ${statusInfo.label}`,
    `${statusInfo.icon} ${statusMessage}`,
    body,
    lang
  );
}

// ── 6. Message du formulaire de contact (vers l'équipe, en français) ────────

export function getContactEmailTemplate({ firstName, lastName, email, subjectLabel, orderNumber, message, lang = "fr" }) {
  [firstName, lastName, email, subjectLabel, orderNumber] = [firstName, lastName, email, subjectLabel, orderNumber].map(escapeHtml);
  const row = (label, value) => `<tr><td style="padding:8px 16px 8px 0;font:14px ${sans};color:${muted};vertical-align:top">${label}</td><td style="padding:8px 0;font:14px ${sans};color:${text}">${value}</td></tr>`;
  const body = `
    <tr><td class="ep-body" style="padding:40px">
      ${eyebrow("Nouveau message")}
      ${heading("Contact Pull-Lover")}
      <table role="presentation" style="width:100%;border-collapse:collapse;margin-top:12px">
        ${row("De", `<strong>${firstName} ${lastName}</strong>`)}
        ${row("E-mail", `<a href="mailto:${email}" style="color:${accentDark}">${email}</a>`)}
        ${row("Sujet", subjectLabel)}
        ${orderNumber ? row("Commande", `<strong>${orderNumber}</strong>`) : ""}
        ${row("Langue", lang === "en" ? "Anglais — répondre en anglais" : "Français")}
      </table>
      <div style="margin-top:26px;padding-top:24px;border-top:1px solid ${line};font:16px/1.7 ${sans};color:${text}">${escapeHtml(message).replaceAll("\n", "<br>")}</div>
    </td></tr>
  `;
  return wrap(`Contact — ${subjectLabel}`, `Message de ${firstName} ${lastName}`, body);
}

// ── 7. Alerte : paiement encaissé sans commande (admin, en français) ───────

export function getPaymentAlertEmailTemplate({ amount, customerEmail, paymentIntentId }) {
  const body = `
    <tr><td class="ep-body" style="padding:40px">
      ${eyebrow("Action requise", "#be123c")}
      ${heading("Paiement sans commande")}
      <p style="margin:0 0 22px;font:15px/1.7 ${sans};color:${text}">Un paiement de <strong>${escapeHtml(emailMoney(amount))}</strong> (${escapeHtml(customerEmail || "email inconnu")}) a été encaissé, mais aucune commande n'est enregistrée.</p>
      ${panel(`${sectionLabel("PaymentIntent Stripe")}<p style="margin:0;font:600 14px ${sans};color:${ink};word-break:break-all">${escapeHtml(paymentIntentId)}</p>`)}
    </td></tr>
  `;
  return wrap("Paiement Stripe sans commande", `Paiement de ${emailMoney(amount)} sans commande enregistrée`, body);
}
