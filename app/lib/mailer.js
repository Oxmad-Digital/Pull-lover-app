// app/lib/mailer.js

import nodemailer from "nodemailer";

// ✅ Configuration du transporteur
const EMAIL_PORT = Number(process.env.EMAIL_PORT) || 587;

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465, // TLS direct sur 465, STARTTLS sur 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    // Certificat du serveur SMTP vérifié ; EMAIL_TLS_INSECURE=true uniquement pour un
    // serveur de test à certificat auto-signé.
    rejectUnauthorized: process.env.EMAIL_TLS_INSECURE !== "true",
  },
  // ✅ Ajout de timeouts
  connectionTimeout: 10000, // 10 secondes
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

// Vérification SMTP au démarrage
transporter.verify((error) => {
  if (error) {
    console.error("❌ SMTP ERROR:", error.message);
    console.error("   → Host:", process.env.EMAIL_HOST);
    console.error("   → Port:", process.env.EMAIL_PORT);
    console.error("   → User:", process.env.EMAIL_USER);
  } else {
    console.log("✅ SMTP connecté et prêt");
    console.log("   → Host:", process.env.EMAIL_HOST);
    console.log("   → User:", process.env.EMAIL_USER);
  }
});

/**
 * Envoie un email
 * @param {Object} options - { to, subject, html, replyTo? }
 */
export async function sendEmail({ to, subject, html, replyTo }) {
  // ✅ Validation
  if (!to) {
    console.error("❌ Destinataire email manquant");
    throw new Error("Destinataire email manquant");
  }

  // ✅ Nettoyage de l'email
  const cleanEmail = to.trim().toLowerCase();
  
  // ✅ Validation format email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    console.error("❌ Format email invalide:", cleanEmail);
    throw new Error(`Format email invalide: ${cleanEmail}`);
  }

  // ✅ Version TEXT (obligatoire pour Gmail)
  const text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // ✅ Configuration de l'email
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || "Mon Site"}" <${process.env.EMAIL_USER}>`,
    to: cleanEmail,
    subject,
    text,
    html,
    // ✅ Headers pour améliorer la délivrabilité
    headers: {
      "X-Priority": "1",
      "X-Mailer": "Nodemailer",
    },
  };

  // ✅ Ajouter replyTo si fourni
  if (replyTo) {
    mailOptions.replyTo = replyTo;
  }

  console.log("📧 ═══════════════════════════════════════");
  console.log("📧 ENVOI EMAIL EN COURS...");
  console.log("📧 De:", mailOptions.from);
  console.log("📧 À:", cleanEmail);
  console.log("📧 Sujet:", subject);
  console.log("📧 ═══════════════════════════════════════");

  try {
    const info = await transporter.sendMail(mailOptions);

    console.log("✅ ═══════════════════════════════════════");
    console.log("✅ EMAIL ENVOYÉ AVEC SUCCÈS !");
    console.log("✅ Message ID:", info.messageId);
    console.log("✅ Destinataire:", cleanEmail);
    console.log("✅ Réponse SMTP:", info.response);
    console.log("✅ ═══════════════════════════════════════");

    return {
      success: true,
      messageId: info.messageId,
      to: cleanEmail,
    };

  } catch (error) {
    console.error("❌ ═══════════════════════════════════════");
    console.error("❌ ÉCHEC ENVOI EMAIL");
    console.error("❌ Destinataire:", cleanEmail);
    console.error("❌ Erreur:", error.message);
    console.error("❌ Code:", error.code);
    console.error("❌ Stack:", error.stack);
    console.error("❌ ═══════════════════════════════════════");

    throw error;
  }
}

/**
 * ✅ Fonction utilitaire pour tester l'envoi
 */
export async function testEmail(testAddress) {
  console.log("🧪 Test d'envoi email à:", testAddress);
  
  return sendEmail({
    to: testAddress,
    subject: "🧪 Test Email - " + new Date().toISOString(),
    html: `
      <div style="font-family: Arial; padding: 20px;">
        <h1>✅ Test Réussi !</h1>
        <p>Cet email a été envoyé le ${new Date().toLocaleString("fr-FR")}</p>
        <p>Si vous recevez cet email, la configuration fonctionne correctement.</p>
      </div>
    `,
  });
}