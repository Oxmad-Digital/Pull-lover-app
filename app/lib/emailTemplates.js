// app/lib/emailTemplates.js
// Tous les templates email Pull-Lover — palette harmonisée avec le site

const coral = "#C95D5D";
const dark = "#0f172a";
const gray100 = "#f8fafc";
const gray200 = "#e2e8f0";
const gray400 = "#94a3b8";
const gray600 = "#475569";

function logoHtml(size = 22, light = false) {
  const color = light ? "#ffffff" : dark;
  const scriptColor = light ? "rgba(255,255,255,0.9)" : dark;
  return `<span style="font-family:'Helvetica Neue',Arial,sans-serif;font-weight:800;font-size:${size}px;color:${color};letter-spacing:-0.5px">Pull</span><span style="font-family:Georgia,'Times New Roman',serif;font-size:${size + 2}px;color:${scriptColor};font-style:italic">Lover</span>`;
}

// Bouton CTA générique
function ctaButton(url, label) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto">
      <tr><td style="border-radius:8px;background:${coral}">
        <a href="${url}" style="display:inline-block;padding:14px 36px;color:#fff;text-decoration:none;font-weight:700;font-size:15px;border-radius:8px;font-family:'Helvetica Neue',Arial,sans-serif">${label}</a>
      </td></tr>
    </table>`;
}

function wrap(title, preheader, bodyRows) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${title}</title>
  <style>
    @media only screen and (max-width: 600px) {
      .ep-header  { padding: 20px 20px 16px !important; }
      .ep-body    { padding: 28px 20px !important; }
      .ep-section { padding: 28px 20px 0 !important; }
      .ep-last    { padding: 0 20px 28px !important; }
      .ep-footer  { padding: 24px 20px !important; }
      .ep-banner  { padding: 24px 20px !important; }
      h1.email-h1 { font-size: 20px !important; }
      .ep-hide    { display: none !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f1f5f9">${preheader}&nbsp;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)">

        <tr><td style="height:4px;background:${coral};font-size:4px;line-height:4px">&nbsp;</td></tr>

        <tr><td class="ep-header" style="padding:24px 40px 20px;text-align:center;border-bottom:1px solid ${gray200}">
          ${logoHtml(22)}
        </td></tr>

        ${bodyRows}

        <tr><td class="ep-footer" style="background:${dark};padding:28px 40px;text-align:center">
          <p style="margin:0 0 8px">${logoHtml(14, true)}</p>
          <p style="margin:0;color:rgba(255,255,255,.45);font-size:12px">© ${new Date().getFullYear()} Pull-Lover — Tous droits réservés</p>
          <p style="margin:6px 0 0;color:rgba(255,255,255,.3);font-size:11px">Email envoyé automatiquement, merci de ne pas y répondre</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── 1. Email de vérification ────────────────────────────────────────────────

export function getVerificationEmailTemplate(name, verificationUrl) {
  const body = `
    <tr><td class="ep-body" style="padding:36px 40px">
      <h1 class="email-h1" style="margin:0 0 12px;font-size:22px;font-weight:800;color:${dark}">Bienvenue, ${name} !</h1>
      <p style="margin:0 0 28px;font-size:15px;color:${gray600};line-height:1.7">
        Merci de rejoindre la communauté Pull-Lover.<br>
        Confirmez votre adresse email pour activer votre compte.
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding:0 0 32px">
          ${ctaButton(verificationUrl, "Vérifier mon adresse email")}
        </td></tr>
      </table>

      <p style="margin:0 0 6px;font-size:13px;color:${gray400}">Ou copiez ce lien dans votre navigateur :</p>
      <p style="margin:0 0 28px;font-size:12px;color:${coral};word-break:break-all">${verificationUrl}</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
        <tr><td style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px 18px">
          <p style="margin:0;font-size:14px;color:#92400e">⏱ <strong>Ce lien expire dans 24 heures.</strong> Si vous ne l'utilisez pas à temps, demandez-en un nouveau depuis la page de connexion.</p>
        </td></tr>
      </table>

      <p style="margin:0;font-size:13px;color:${gray400}">Vous n'avez pas créé ce compte ? Ignorez simplement cet email.</p>
    </td></tr>
  `;
  return wrap(
    "Vérification de votre email — Pull-Lover",
    `Bonjour ${name}, confirmez votre email pour activer votre compte Pull-Lover.`,
    body
  );
}

// ── 2. Réinitialisation de mot de passe ────────────────────────────────────

export function getResetPasswordEmailTemplate(name, resetUrl) {
  const body = `
    <tr><td class="ep-body" style="padding:36px 40px">
      <h1 class="email-h1" style="margin:0 0 12px;font-size:22px;font-weight:800;color:${dark}">Réinitialisation de mot de passe</h1>
      <p style="margin:0 0 28px;font-size:15px;color:${gray600};line-height:1.7">
        Bonjour ${name},<br><br>
        Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding:0 0 32px">
          ${ctaButton(resetUrl, "Réinitialiser mon mot de passe")}
        </td></tr>
      </table>

      <p style="margin:0 0 6px;font-size:13px;color:${gray400}">Ou copiez ce lien dans votre navigateur :</p>
      <p style="margin:0 0 28px;font-size:12px;color:${coral};word-break:break-all">${resetUrl}</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
        <tr><td style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px 18px">
          <p style="margin:0;font-size:14px;color:#92400e">⏱ <strong>Ce lien expire dans 1 heure.</strong> Passé ce délai, vous devrez faire une nouvelle demande.</p>
        </td></tr>
      </table>

      <p style="margin:0;font-size:13px;color:${gray400}">Vous n'avez pas fait cette demande ? Ignorez cet email, votre mot de passe reste inchangé.</p>
    </td></tr>
  `;
  return wrap(
    "Réinitialisation de mot de passe — Pull-Lover",
    `Bonjour ${name}, réinitialisez votre mot de passe Pull-Lover.`,
    body
  );
}

// ── 3. Confirmation de commande (client) ────────────────────────────────────

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
}) {
  const body = `
    <tr><td class="ep-banner" style="background:${gray100};padding:28px 40px;text-align:center;border-bottom:1px solid ${gray200}">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:${gray400};letter-spacing:1.2px;text-transform:uppercase">Commande confirmée</p>
      <h1 class="email-h1" style="margin:0 0 8px;font-size:24px;font-weight:800;color:${dark}">Merci, ${firstname} !</h1>
      <p style="margin:0;font-size:14px;color:${gray600}">Votre commande a bien été reçue et est en cours de traitement.</p>
    </td></tr>

    <tr><td class="ep-section" style="padding:28px 40px 0">

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
        <tr><td style="background:${gray100};border:1px solid ${gray200};border-radius:8px;padding:16px 20px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="margin:0 0 3px;font-size:10px;font-weight:700;color:${gray400};letter-spacing:1px;text-transform:uppercase">Numéro de commande</p>
                <p style="margin:0;font-size:20px;font-weight:800;color:${coral};letter-spacing:1px">#${orderNumber}</p>
              </td>
              <td style="text-align:right">
                <p style="margin:0 0 3px;font-size:10px;font-weight:700;color:${gray400};letter-spacing:1px;text-transform:uppercase">Date</p>
                <p style="margin:0;font-size:13px;font-weight:600;color:${dark}">${orderDate}</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>

      <p style="margin:0 0 10px;font-size:10px;font-weight:700;color:${gray400};letter-spacing:1.2px;text-transform:uppercase">Articles commandés</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;border-collapse:collapse">
        <thead>
          <tr style="border-bottom:2px solid ${gray200}">
            <th style="padding:10px 0;text-align:left;font-size:11px;font-weight:700;color:${gray400};text-transform:uppercase;letter-spacing:.5px">Produit</th>
            <th style="padding:10px 0;text-align:center;font-size:11px;font-weight:700;color:${gray400};text-transform:uppercase;letter-spacing:.5px;width:40px">Qté</th>
            <th style="padding:10px 0;text-align:right;font-size:11px;font-weight:700;color:${gray400};text-transform:uppercase;letter-spacing:.5px">Prix</th>
          </tr>
        </thead>
        <tbody>${productListHtml}</tbody>
        <tfoot>
          <tr style="border-top:2px solid ${gray200}">
            <td colspan="2" style="padding:14px 0;font-size:14px;font-weight:700;color:${dark}">Total</td>
            <td style="padding:14px 0;text-align:right;font-size:18px;font-weight:800;color:${coral}">${Number(total).toLocaleString("fr-FR")} €</td>
          </tr>
        </tfoot>
      </table>

      <p style="margin:0 0 10px;font-size:10px;font-weight:700;color:${gray400};letter-spacing:1.2px;text-transform:uppercase">Détails de livraison</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
        <tr><td style="background:${gray100};border:1px solid ${gray200};border-radius:8px;padding:18px 20px">
          <p style="margin:0 0 10px;font-size:14px;color:${dark}"><strong>Adresse :</strong> ${address}, ${city}</p>
          <p style="margin:0 0 10px;font-size:14px;color:${dark}"><strong>Livraison :</strong> ${deliveryLabel}</p>
          <p style="margin:0;font-size:14px;color:${dark}"><strong>Paiement :</strong> ${paymentLabel}</p>
        </td></tr>
      </table>

      ${orderUrl ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
        <tr><td align="center">
          ${ctaButton(orderUrl, "Voir ma commande")}
        </td></tr>
      </table>` : ""}

      <p style="margin:0 0 36px;font-size:13px;color:${gray400};line-height:1.6">
        Une question ? Répondez directement à cet email, nous vous répondrons dans les plus brefs délais.
      </p>
    </td></tr>
  `;
  return wrap(
    `Confirmation de votre commande #${orderNumber}`,
    `Merci ${firstname} ! Votre commande #${orderNumber} a bien été confirmée.`,
    body
  );
}

// ── 3. Notification nouvelle commande (admin) ───────────────────────────────

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
}) {
  const body = `
    <tr><td class="ep-banner" style="background:${dark};padding:24px 40px;text-align:center">
      <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:rgba(255,255,255,.5);letter-spacing:1.5px;text-transform:uppercase">Nouvelle commande reçue</p>
      <h1 class="email-h1" style="margin:0 0 4px;font-size:22px;font-weight:800;color:#fff">Commande #${orderNumber}</h1>
      <p style="margin:0;font-size:13px;color:rgba(255,255,255,.55)">${orderDate}</p>
    </td></tr>

    <tr><td class="ep-section" style="padding:28px 40px 0">

      <p style="margin:0 0 10px;font-size:10px;font-weight:700;color:${gray400};letter-spacing:1.2px;text-transform:uppercase">Client</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
        <tr><td style="background:${gray100};border:1px solid ${gray200};border-radius:8px;padding:18px 20px">
          <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:${dark}">${firstname} ${lastname}</p>
          <p style="margin:0 0 6px;font-size:14px;color:${gray600}">📧 <a href="mailto:${email}" style="color:${coral};text-decoration:none">${email}</a></p>
          <p style="margin:0 0 6px;font-size:14px;color:${gray600}">📞 ${phone || "Non renseigné"}</p>
          <p style="margin:0;font-size:14px;color:${gray600}">📍 ${address}, ${city}</p>
        </td></tr>
      </table>

      <p style="margin:0 0 10px;font-size:10px;font-weight:700;color:${gray400};letter-spacing:1.2px;text-transform:uppercase">Articles commandés</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border-collapse:collapse">
        <thead>
          <tr style="border-bottom:2px solid ${gray200}">
            <th style="padding:10px 0;text-align:left;font-size:11px;font-weight:700;color:${gray400};text-transform:uppercase;letter-spacing:.5px">Produit</th>
            <th style="padding:10px 0;text-align:center;font-size:11px;font-weight:700;color:${gray400};text-transform:uppercase;letter-spacing:.5px;width:40px">Qté</th>
            <th style="padding:10px 0;text-align:right;font-size:11px;font-weight:700;color:${gray400};text-transform:uppercase;letter-spacing:.5px">Prix</th>
          </tr>
        </thead>
        <tbody>${productListHtml}</tbody>
        <tfoot>
          <tr style="border-top:2px solid ${gray200}">
            <td colspan="2" style="padding:14px 0;font-size:14px;font-weight:700;color:${dark}">Total</td>
            <td style="padding:14px 0;text-align:right;font-size:20px;font-weight:800;color:${coral}">${Number(total).toLocaleString("fr-FR")} €</td>
          </tr>
        </tfoot>
      </table>

      <p style="margin:0 0 10px;font-size:10px;font-weight:700;color:${gray400};letter-spacing:1.2px;text-transform:uppercase">Détails</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
        <tr><td style="background:${gray100};border:1px solid ${gray200};border-radius:8px;padding:18px 20px">
          <p style="margin:0 0 8px;font-size:14px;color:${dark}"><strong>Livraison :</strong> ${deliveryLabel}</p>
          <p style="margin:0;font-size:14px;color:${dark}"><strong>Paiement :</strong> ${paymentLabel}</p>
        </td></tr>
      </table>

    </td></tr>
  `;
  return wrap(
    `Nouvelle commande #${orderNumber} — Admin`,
    `Nouvelle commande de ${firstname} ${lastname} — Total : ${Number(total).toLocaleString("fr-FR")} €`,
    body
  );
}

// ── 4. Mise à jour du statut de commande (client) ──────────────────────────

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
}) {
  const body = `
    <tr><td class="ep-body" style="padding:36px 40px 0;text-align:center">
      <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:${gray400};letter-spacing:1.2px;text-transform:uppercase">Mise à jour de commande</p>
      <h1 class="email-h1" style="margin:0 0 20px;font-size:22px;font-weight:800;color:${dark}">Bonjour ${firstname},</h1>

      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 20px">
        <tr><td style="background:${statusInfo.color}1a;border:1px solid ${statusInfo.color}55;border-radius:24px;padding:10px 26px">
          <span style="font-size:18px">${statusInfo.icon}</span>
          <span style="margin-left:8px;font-size:15px;font-weight:700;color:${statusInfo.color};vertical-align:middle">${statusInfo.label}</span>
        </td></tr>
      </table>

      <p style="margin:0 0 28px;font-size:15px;color:${gray600};line-height:1.7">${statusMessage}</p>

      ${trackingNumber ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
        <tr><td style="background:#f0fafe;border:1px solid #bae6fd;border-radius:8px;padding:16px 20px;text-align:center">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#0369a1;letter-spacing:1px;text-transform:uppercase">Numéro de suivi</p>
          <p style="margin:0 0 12px;font-size:20px;font-weight:800;color:#0c4a6e;letter-spacing:1.5px">${trackingNumber}</p>
          ${trackingUrl ? `<a href="${trackingUrl}" style="display:inline-block;padding:8px 20px;background:#0ea5e9;color:#fff;text-decoration:none;font-weight:700;font-size:13px;border-radius:6px">Suivre mon colis →</a>` : ""}
        </td></tr>
      </table>` : ""}

      ${orderUrl ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:36px">
        <tr><td align="center">
          ${ctaButton(orderUrl, "Voir ma commande")}
        </td></tr>
      </table>` : `<div style="margin-bottom:36px"></div>`}
    </td></tr>

    <tr><td class="ep-last" style="padding:0 40px 36px">
      <p style="margin:0 0 10px;font-size:10px;font-weight:700;color:${gray400};letter-spacing:1.2px;text-transform:uppercase">Récapitulatif</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="background:${gray100};border:1px solid ${gray200};border-radius:8px;padding:18px 20px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:0 0 12px">
              <p style="margin:0 0 3px;font-size:10px;font-weight:700;color:${gray400};letter-spacing:1px;text-transform:uppercase">Commande</p>
              <p style="margin:0;font-size:18px;font-weight:800;color:${coral}">#${orderNumber}</p>
            </td></tr>
            <tr><td style="padding:0 0 12px">
              <p style="margin:0 0 3px;font-size:10px;font-weight:700;color:${gray400};letter-spacing:1px;text-transform:uppercase">Adresse de livraison</p>
              <p style="margin:0;font-size:14px;font-weight:600;color:${dark}">${address}, ${city}</p>
            </td></tr>
            <tr><td>
              <p style="margin:0 0 3px;font-size:10px;font-weight:700;color:${gray400};letter-spacing:1px;text-transform:uppercase">Total</p>
              <p style="margin:0;font-size:16px;font-weight:800;color:${dark}">${Number(total).toLocaleString("fr-FR")} €</p>
            </td></tr>
          </table>
        </td></tr>
      </table>

      <p style="margin:20px 0 0;font-size:13px;color:${gray400};line-height:1.6">Pour toute question, répondez directement à cet email.</p>
    </td></tr>
  `;
  return wrap(
    `Commande #${orderNumber} — ${statusInfo.label}`,
    `${statusInfo.icon} ${statusMessage}`,
    body
  );
}
