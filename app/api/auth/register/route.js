// app/api/auth/register/route.js
import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { sendEmail } from "@/app/lib/mailer";
import { getVerificationEmailTemplate } from "@/app/lib/emailTemplates";
import { validatePassword } from "@/app/lib/password";
import { translator } from "@/app/i18n/server";
import { localePath } from "@/app/i18n/config.mjs";
import { createToken } from "@/app/lib/tokens";
import { clientIp, rateLimit } from "@/app/lib/rateLimit";

// Sanitization
function sanitizeInput(input) {
  if (typeof input !== "string") return input;
  return input
    .trim()
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "");
}

// Validation email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;

  const disposableDomains = ["tempmail.com", "guerrillamail.com", "10minutemail.com"];
  const domain = email.split("@")[1]?.toLowerCase();

  return !disposableDomains.includes(domain);
}

export async function POST(req) {
  let t = translator(req);
  try {
    await connectDB();

    // IP
    const ip = clientIp(req);

    // Rate limit (partagé entre instances)
    const limit = await rateLimit(`register:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
    if (!limit.allowed) {
      return NextResponse.json(
        { message: t(`Trop de tentatives. Réessayez dans ${limit.retryAfter} secondes.`, `Too many attempts. Try again in ${limit.retryAfter} seconds.`) },
        { status: 429 }
      );
    }

    const body = await req.json();
    t = translator(req, body?.locale);
    let { name, email, password } = body;
    const verificationUrlFor = (token) => `${process.env.NEXT_PUBLIC_APP_URL}${localePath(t.lang, "/verify-email")}?token=${token}`;
    const verifySubject = t("🔐 Vérifiez votre email", "🔐 Verify your email");
    // Réponse identique que l'adresse soit libre ou déjà inscrite (anti-énumération)
    const created = () => NextResponse.json(
      {
        message: t("Compte créé ! Consultez votre email pour vérifier votre adresse.", "Account created! Check your email to verify your address."),
        requiresVerification: true,
      },
      { status: 201 }
    );

    // Sanitization
    name = sanitizeInput(name);
    email = sanitizeInput(email)?.toLowerCase();

    // Validations de base
    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string" || !name || !email || !password) {
      return NextResponse.json(
        { message: t("Tous les champs sont obligatoires", "All fields are required") },
        { status: 400 }
      );
    }

    // Validation nom
    if (name.length < 2 || name.length > 50) {
      return NextResponse.json(
        { message: t("Le nom doit contenir entre 2 et 50 caractères", "Your name must be between 2 and 50 characters") },
        { status: 400 }
      );
    }

    // Validation email
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { message: t("Adresse email invalide", "Invalid email address") },
        { status: 400 }
      );
    }

    // Validation password
    const passwordCheck = validatePassword(password, t.lang);
    if (!passwordCheck.isValid) {
      return NextResponse.json(
        {
          message: t("Mot de passe invalide : ", "Invalid password: ") + passwordCheck.errors.join(", "),
          errors: passwordCheck.errors,
        },
        { status: 400 }
      );
    }

    // Vérifier email existant
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // 🔄 Si email non vérifié, renvoyer un nouveau lien (au plus 3 par heure et par adresse)
      const resend = await rateLimit(`verify:${email}`, { limit: 3, windowMs: 60 * 60 * 1000 });
      if (!existingUser.emailVerified && resend.allowed) {
        const { token, hash } = createToken();
        existingUser.verificationToken = hash;
        existingUser.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await existingUser.save();

        try {
          await sendEmail({
            to: existingUser.email,
            subject: verifySubject,
            html: getVerificationEmailTemplate(existingUser.name, verificationUrlFor(token), t.lang),
          });
        } catch (emailErr) {
          console.error("❌ Erreur envoi email:", emailErr);
        }
      }

      return created();
    }

    // Hash password (12 rounds)
    const hashedPassword = await bcrypt.hash(password, 12);

    // 🎟️ Créer token de vérification
    const { token: verificationToken, hash: verificationTokenHash } = createToken();
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Créer utilisateur
    await User.create({
      name,
      email,
      password: hashedPassword,
      role: "customer",
      emailVerified: false,
      verificationToken: verificationTokenHash,
      verificationTokenExpiry,
    });

    // ✅ Créer un Customer automatiquement
    try {
      const Customer = (await import("@/app/models/Customer")).default;
      const existingCustomer = await Customer.findOne({ email });

      if (!existingCustomer) {
        const nameParts = name.split(" ");
        await Customer.create({
          firstname: nameParts[0] || name,
          lastname: nameParts.slice(1).join(" ") || "",
          email,
          phone: "",
          city: "",
          address: "",
          totalOrders: 0,
          totalSpent: 0,
          status: "active",
        });
      }
    } catch (customerError) {
      console.error("⚠️ Erreur création Customer:", customerError.message);
      // Ne bloque pas l'inscription
    }

    // 📧 Envoyer email de vérification
    const verificationUrl = verificationUrlFor(verificationToken);
    const htmlContent = getVerificationEmailTemplate(name, verificationUrl, t.lang);

    try {
      await sendEmail({
        to: email,
        subject: verifySubject,
        html: htmlContent,
      });
    } catch (emailError) {
      console.error("❌ Erreur envoi email:", emailError.message);
      // On ne bloque pas l'inscription si l'email échoue
    }


    return created();

  } catch (error) {
    console.error("❌ Erreur inscription détaillée:", {
      message: error.message,
      name: error.name,
      code: error.code,
    });

    // Erreur de contrainte d'unicité PostgreSQL
    // (inscription simultanée de la même adresse) : même réponse que pour une adresse libre
    if (error.code === 11000) {
      return NextResponse.json(
        { message: t("Compte créé ! Consultez votre email pour vérifier votre adresse.", "Account created! Check your email to verify your address."), requiresVerification: true },
        { status: 201 }
      );
    }

    // Erreur de validation Mongoose
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(e => e.message);
      return NextResponse.json(
        { message: messages.join(". ") },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: t("Erreur serveur lors de l'inscription. Réessayez.", "Server error during sign-up. Please try again.") },
      { status: 500 }
    );
  }
}
