"use client";

import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ButtonPrimary } from "@/app/components/ui/Button";
import AuthShell from "../AuthShell";
import { useLang } from "@/app/i18n/I18nProvider";
import { localePath } from "@/app/i18n/config.mjs";
import "../auth.css";

const TEXT = {
  fr: {
    invalid: "Email ou mot de passe incorrect",
    eyebrow: "Votre espace",
    title: "Heureux de vous revoir.",
    description: "Retrouvez vos commandes, vos adresses et les pièces que vous avez choisies.",
    imageAlt: "Le cardigan porté au bord du lac",
    visualTitle: "Des pièces qui traversent le temps.",
    visualText: "Pensées à Madagascar, tricotées à la demande et faites pour vous accompagner saison après saison.",
    email: "Adresse e-mail",
    emailPlaceholder: "vous@exemple.com",
    password: "Mot de passe",
    passwordPlaceholder: "Votre mot de passe",
    hidePassword: "Masquer le mot de passe",
    showPassword: "Afficher le mot de passe",
    hide: "Masquer",
    show: "Afficher",
    remember: "Se souvenir de moi",
    forgot: "Mot de passe oublié",
    signingIn: "Connexion…",
    signIn: "Se connecter",
    noAccount: "Pas encore de compte ?",
    createAccount: "Créer un compte",
  },
  en: {
    invalid: "Incorrect email or password",
    eyebrow: "Your account",
    title: "Welcome back.",
    description: "Find your orders, your addresses and the pieces you’ve chosen.",
    imageAlt: "The cardigan worn by the lake",
    visualTitle: "Pieces that stand the test of time.",
    visualText: "Designed in Madagascar, knitted to order and made to stay with you season after season.",
    email: "Email address",
    emailPlaceholder: "you@example.com",
    password: "Password",
    passwordPlaceholder: "Your password",
    hidePassword: "Hide password",
    showPassword: "Show password",
    hide: "Hide",
    show: "Show",
    remember: "Remember me",
    forgot: "Forgot password",
    signingIn: "Signing in…",
    signIn: "Sign in",
    noAccount: "Don’t have an account yet?",
    createAccount: "Create an account",
  },
};

export default function LoginPage() {
  const lang = useLang();
  const t = TEXT[lang];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", { email, password, lang, redirect: false });
    setLoading(false);
    // Le serveur renvoie un message explicite (compte verrouillé, email non vérifié…)
    if (res?.error) return setError(res.error === "CredentialsSignin" ? t.invalid : res.error);
    const session = await getSession();
    router.push(session?.user?.role === "admin" ? "/admin" : localePath(lang, "/dashboard"));
  }

  return (
    <AuthShell
      variant="login"
      eyebrow={t.eyebrow}
      title={t.title}
      description={t.description}
      image="/api/media/pull-lover-manequin-cardigan-2.webp?v=b25ae1191378"
      imageAlt={t.imageAlt}
      visualTitle={t.visualTitle}
      visualText={t.visualText}
    >
      <form className="auth-form" onSubmit={handleLogin} data-reveal-stagger>
        <div className="auth-fields">
          <div className="auth-field">
            <label htmlFor="login-email">{t.email}</label>
            <div className="auth-input-wrap">
              <input
                id="login-email"
                type="email"
                placeholder={t.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                aria-invalid={Boolean(error)}
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">{t.password}</label>
            <div className="auth-input-wrap">
              <input
                id="login-password"
                type={showPwd ? "text" : "password"}
                placeholder={t.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                aria-invalid={Boolean(error)}
                required
              />
              <button
                className="auth-password-toggle"
                type="button"
                aria-label={showPwd ? t.hidePassword : t.showPassword}
                onClick={() => setShowPwd(!showPwd)}
              >
                {showPwd ? t.hide : t.show}
              </button>
            </div>
          </div>
        </div>

        <div className="auth-inline-row">
          <label className="auth-check">
            <input type="checkbox" />
            <span>{t.remember}</span>
          </label>
          <Link className="auth-link" href={localePath(lang, "/auth/forgot-password")}>{t.forgot}</Link>
        </div>

        {error && <p className="auth-error" role="alert">{error}</p>}

        <ButtonPrimary className="auth-submit" full type="submit" disabled={loading}>
          {loading ? t.signingIn : t.signIn}
        </ButtonPrimary>


        <div className="auth-switch">
          <p>{t.noAccount}</p>
          <Link href={localePath(lang, "/auth/register")}>{t.createAccount}</Link>
        </div>
      </form>
    </AuthShell>
  );
}
