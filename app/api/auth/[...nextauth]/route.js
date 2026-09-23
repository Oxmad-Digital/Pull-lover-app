// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";
import bcrypt from "bcryptjs";

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
        await connectDB();

        const user = await User.findOne({ email: credentials.email });
        if (!user) throw new Error("Utilisateur introuvable");

        const ok = await bcrypt.compare(credentials.password, user.password);
        if (!ok) throw new Error("Mot de passe incorrect");

        // 🔒 VÉRIFICATION EMAIL OBLIGATOIRE
        if (!user.emailVerified) {
          throw new Error("Email non vérifié. Consultez votre boîte mail.");
        }

        // 🔒 VÉRIFICATION COMPTE VERROUILLÉ
        if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
          const minutes = Math.ceil((user.accountLockedUntil - new Date()) / 60000);
          throw new Error(`Compte verrouillé. Réessayez dans ${minutes} min.`);
        }

        // ✅ Réinitialiser tentatives échouées
        user.failedLoginAttempts = 0;
        user.lastLoginAt = new Date();
        user.lastLoginIP = credentials.ip || "unknown";
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
        const existing = await User.findOne({ email: user.email });
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
        const dbUser = await User.findOne({ email: token.email });
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
