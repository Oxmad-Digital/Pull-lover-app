import { createPostgresModel } from "@/app/lib/postgres-model";
import "./Product";

const User = createPostgresModel({
  table: "users",
  references: { favorites: "products" },
  defaults: {
    password: null,
    role: "customer",
    emailVerified: false,
    verificationToken: null,
    verificationTokenExpiry: null,
    resetToken: null,
    resetTokenExpiry: null,
    lastLoginIP: null,
    lastLoginAt: null,
    failedLoginAttempts: 0,
    accountLockedUntil: null,
    passwordHistory: [],
    phone: null,
    address: {},
    newsletter: false,
    language: "fr",
    avatar: null,
    avatarKey: null,
    favorites: [],
  },
  normalize: (user) => ({
    ...user,
    name: user.name?.trim(),
    email: user.email?.toLowerCase().trim(),
  }),
});

export default User;
