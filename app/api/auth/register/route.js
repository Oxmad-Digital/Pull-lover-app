// app/api/auth/register/route.js
import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { sendEmail } from "@/app/lib/mailer";
import { getVerificationEmailTemplate } from "@/app/lib/emailTemplates";
import { validatePassword } from "@/app/lib/password";
import { translator } from "@/app/i18n/server";
import { localePath } from "@/app/i18n/config.mjs";

// Rate limiting
const registrationAttempts = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;  // ✅ 60 secondes
  const maxAttempts = 5;        // ✅ 5 tentatives

  if (!registrationAttempts.has(ip)) {
    registrationAttempts.set(ip, []);
  }

  const attempts = registrationAttempts.get(ip);
  const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
  registrationAttempts.set(ip, recentAttempts);

  if (recentAttempts.length >= maxAttempts) {
    const retryAfter = Math.ceil((recentAttempts[0] + windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }

  recentAttempts.push(now);
  registrationAttempts.set(ip, recentAttempts);
  return { allowed: true };
}

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
    const ip = req.headers.get("x-forwarded-for") || "unknown";

    // Rate limit
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: t(`Trop de tentatives. Réessayez dans ${rateLimit.retryAfter} secondes.`, `Too many attempts. Try again in ${rateLimit.retryAfter} seconds.`) },
        { status: 429 }
      );
    }

    const body = await req.json();
    t = translator(req, body?.locale);
    let { name, email, password } = body;
    const verificationUrlFor = (token) => `${process.env.NEXT_PUBLIC_APP_URL}${localePath(t.lang, "/verify-email")}?token=${token}`;
    const verifySubject = t("🔐 Vérifiez votre email", "🔐 Verify your email");

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
      console.log(`⚠️  Email existant: ${email} | IP: ${ip}`);

      // 🔄 Si email non vérifié, renvoyer un nouveau lien
      if (!existingUser.emailVerified) {
        const newToken = crypto.randomBytes(32).toString("hex");
        existingUser.verificationToken = newToken;
        existingUser.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await existingUser.save();

        const verificationUrl = verificationUrlFor(newToken);
        const htmlContent = getVerificationEmailTemplate(existingUser.name, verificationUrl, t.lang);

        try {
          await sendEmail({
            to: existingUser.email,
            subject: verifySubject,
            html: htmlContent,
          });
        } catch (emailErr) {
          console.error("❌ Erreur envoi email:", emailErr);
        }

        return NextResponse.json(
          { message: t("Email déjà inscrit mais non vérifié. Un nouveau lien de vérification a été envoyé.", "This email is already registered but not verified. A new verification link has been sent.") },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { message: t("Email déjà utilisé", "This email is already in use") },
        { status: 400 }
      );
    }

    // Hash password (12 rounds)
    const hashedPassword = await bcrypt.hash(password, 12);

    // 🎟️ Créer token de vérification
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Créer utilisateur
    await User.create({
      name,
      email,
      password: hashedPassword,
      role: "customer",
      emailVerified: false,
      verificationToken,
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
        console.log(`✅ Customer créé pour: ${email}`);
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
      console.log(`✅ Email de vérification envoyé à: ${email}`);
    } catch (emailError) {
      console.error("❌ Erreur envoi email:", emailError.message);
      // On ne bloque pas l'inscription si l'email échoue
    }

    console.log(`✅ Nouvel utilisateur créé: ${email} | IP: ${ip}`);

    return NextResponse.json(
      {
        message: t("Compte créé ! Consultez votre email pour vérifier votre adresse.", "Account created! Check your email to verify your address."),
        requiresVerification: true,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("❌ Erreur inscription détaillée:", {
      message: error.message,
      name: error.name,
      code: error.code,
    });

    // Erreur de contrainte d'unicité PostgreSQL
    if (error.code === 11000) {
      return NextResponse.json(
        { message: t("Cet email est déjà utilisé", "This email is already in use") },
        { status: 400 }
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
