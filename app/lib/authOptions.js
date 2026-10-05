// app/lib/authOptions.js
// Configuration NextAuth partagée (route [...nextauth], getServerSession, contrôles d'accès).
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";
import bcrypt from "bcryptjs";
import { toLocale, tr } from "@/app/i18n/config.mjs";
import { clientIp, rateLimit } from "@/app/lib/rateLimit";

// Tentatives de connexion par IP (tous comptes confondus : freine le credential stuffing)
const LOGIN_IP_LIMIT = { limit: 20, windowMs: 15 * 60 * 1000 };

// Tentatives sur un même compte depuis une même IP (force brute). Pas de verrouillage global du
// compte : un tiers pourrait sinon bloquer n'importe qui (l'admin compris) avec 5 mauvais mots de passe.
const LOGIN_ACCOUNT_IP_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 };

// Plafond large par compte, toutes IP confondues (force brute distribuée)
const LOGIN_ACCOUNT_LIMIT = { limit: 50, windowMs: 60 * 60 * 1000 };

// Fréquence de revérification du compte en base (mot de passe changé, rôle retiré, compte supprimé)
const RECHECK_MS = 5 * 60 * 1000;

const passwordStamp = (user) => (user.passwordChangedAt ? new Date(user.passwordChangedAt).getTime() : 0);

export const authOptions = {
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 jours
  },

  providers: [
    CredentialsProvider({
      async authorize(credentials, req) {
        const email = typeof credentials?.email === "string" ? credentials.email.toLowerCase().trim() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        // Langue de la page de connexion : les erreurs ci-dessous sont affichées telles quelles
        const lang = toLocale(credentials?.lang);
        const t = (fr, en) => tr(lang, fr, en);
        const invalid = t("Email ou mot de passe incorrect", "Incorrect email or password");
        if (!email || !password) throw new Error(t("Email et mot de passe requis", "Email and password are required"));

        const ip = clientIp(req);
        // Limites vérifiées avant toute lecture du compte : la réponse ne dit rien de son existence
        const limits = await Promise.all([
          rateLimit(`login:${ip}`, LOGIN_IP_LIMIT),
          rateLimit(`login:account-ip:${email}:${ip}`, LOGIN_ACCOUNT_IP_LIMIT),
          rateLimit(`login:account:${email}`, LOGIN_ACCOUNT_LIMIT),
        ]);
        const blocked = limits.filter((result) => !result.allowed);
        if (blocked.length) {
          const minutes = Math.ceil(Math.max(...blocked.map((result) => result.retryAfter)) / 60);
          throw new Error(t(`Trop de tentatives. Réessayez dans ${minutes} min.`, `Too many attempts. Try again in ${minutes} min.`));
        }

        await connectDB();

        const user = await User.findOne({ email });
        // Compte inexistant ou sans mot de passe local (ancien compte Google) : même réponse
        if (!user || !user.password) throw new Error(invalid);

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) throw new Error(invalid);

        // 🔒 VÉRIFICATION EMAIL OBLIGATOIRE
        if (!user.emailVerified) {
          throw new Error(t("Email non vérifié. Consultez votre boîte mail.", "Email not verified. Please check your inbox."));
        }

        // L'IP de connexion n'est plus conservée (donnée personnelle sans usage) ; l'ancienne valeur est effacée
        user.failedLoginAttempts = 0;
        user.accountLockedUntil = null;
        user.lastLoginAt = new Date();
        user.lastLoginIP = null;
        await user.save();

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          passwordChangedAt: passwordStamp(user),
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "customer";
        token.emailVerified = user.emailVerified;
        token.pwd = user.passwordChangedAt;
        token.checkedAt = Date.now();
        return token;
      }

      // Session existante : le compte est relu régulièrement. Une erreur levée ici invalide la
      // session (NextAuth efface le cookie et getServerSession renvoie null).
      if (!token.checkedAt || Date.now() - token.checkedAt > RECHECK_MS) {
        await connectDB();
        const dbUser = token.id ? await User.findById(token.id) : null;
        if (!dbUser || !dbUser.password || passwordStamp(dbUser) !== (token.pwd ?? 0)) {
          throw new Error("SESSION_REVOKED");
        }
        token.role = dbUser.role;
        token.emailVerified = dbUser.emailVerified;
        token.checkedAt = Date.now();
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.emailVerified = token.emailVerified;
      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
  },
};
