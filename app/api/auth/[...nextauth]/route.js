// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";
import bcrypt from "bcryptjs";

// Verrouillage après plusieurs mots de passe erronés
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

export const authOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email.toLowerCase().trim() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) throw new Error("Email et mot de passe requis");

        await connectDB();

        const user = await User.findOne({ email });
        if (!user) throw new Error("Email ou mot de passe incorrect");

        // 🔒 VÉRIFICATION COMPTE VERROUILLÉ (avant tout test du mot de passe)
        if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
          const minutes = Math.ceil((user.accountLockedUntil - new Date()) / 60000);
          throw new Error(`Compte verrouillé. Réessayez dans ${minutes} min.`);
        }

        // Compte créé via Google : pas de mot de passe local
        if (!user.password) throw new Error("Ce compte utilise la connexion Google.");

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
          user.failedLoginAttempts = (Number(user.failedLoginAttempts) || 0) + 1;
          if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
            user.accountLockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
            user.failedLoginAttempts = 0;
          }
          await user.save();
          throw new Error("Email ou mot de passe incorrect");
        }

        // 🔒 VÉRIFICATION EMAIL OBLIGATOIRE
        if (!user.emailVerified) {
          throw new Error("Email non vérifié. Consultez votre boîte mail.");
        }

        // ✅ Réinitialiser tentatives échouées
        user.failedLoginAttempts = 0;
        user.accountLockedUntil = null;
        user.lastLoginAt = new Date();
        user.lastLoginIP = typeof credentials.ip === "string" ? credentials.ip : "unknown";
        await user.save();

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await connectDB();
        const existing = await User.findOne({ email: String(user.email || "").toLowerCase() });
        if (!existing) {
          await User.create({
            name: user.name,
            email: user.email,
            emailVerified: true,
            role: "customer",
            lastLoginAt: new Date(),
          });
        } else {
          existing.lastLoginAt = new Date();
          if (!existing.emailVerified) existing.emailVerified = true;
          await existing.save();
        }
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role ?? "customer";
        token.emailVerified = user.emailVerified ?? account?.provider === "google";
      }
      // Charger l'id et le rôle réels depuis PostgreSQL pour les providers OAuth
      if (account?.provider && account.provider !== "credentials") {
        await connectDB();
        const dbUser = await User.findOne({ email: String(token.email || "").toLowerCase() });
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.role = dbUser.role;
          token.emailVerified = dbUser.emailVerified;
        }
      }
      if (!token.id && user?.id) token.id = user.id;
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

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
