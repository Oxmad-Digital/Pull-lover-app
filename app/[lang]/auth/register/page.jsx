"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ButtonPrimary } from "@/app/components/ui/Button";
import { passwordHint, validatePassword } from "@/app/lib/password";
import AuthShell from "../AuthShell";
import { useLang } from "@/app/i18n/I18nProvider";
import { localePath } from "@/app/i18n/config.mjs";
import "../auth.css";

const TEXT = {
  fr: {
    weak: "Faible",
    medium: "Moyen",
    strong: "Fort",
    security: (label) => `Sécurité ${label.toLowerCase()}`,
    mismatch: "Les mots de passe ne correspondent pas",
    acceptTerms: "Vous devez accepter les conditions",
    tooWeak: (hint) => `Mot de passe trop faible : ${hint}`,
    error: "Erreur",
    created: "Compte créé ! Redirection…",
    serverError: "Erreur serveur",
    eyebrow: "Rejoindre Pull-Lover",
    title: "Créer votre espace.",
    description: "Suivez vos commandes et gardez vos informations à portée de main.",
    imageAlt: "Les mains d’une artisane pendant les finitions d’un pull",
    visualTitle: "Votre histoire avec la maille commence ici.",
    visualText: "Une fabrication à la demande, portée par les gestes de notre atelier familial à Antananarivo.",
    name: "Nom complet",
    namePlaceholder: "Votre nom",
    email: "Adresse e-mail",
    emailPlaceholder: "vous@exemple.com",
    password: "Mot de passe",
    passwordPlaceholder: "8 caractères minimum",
    hidePassword: "Masquer le mot de passe",
    showPassword: "Afficher le mot de passe",
    hide: "Masquer",
    show: "Afficher",
    confirm: "Confirmer le mot de passe",
    confirmPlaceholder: "Confirmez votre mot de passe",
    terms: (terms, privacy) => <>J’accepte les {terms} et la {privacy}.</>,
    termsLink: "conditions de vente",
    privacyLink: "politique de confidentialité",
    creating: "Création…",
    submit: "Créer mon compte",
    hasAccount: "Vous avez déjà un compte ?",
    signIn: "Se connecter",
  },
  en: {
    weak: "Weak",
    medium: "Medium",
    strong: "Strong",
    security: (label) => `${label} password`,
    mismatch: "Passwords don’t match",
    acceptTerms: "You must accept the terms",
    tooWeak: (hint) => `Password too weak: ${hint}`,
    error: "Error",
    created: "Account created! Redirecting…",
    serverError: "Server error",
    eyebrow: "Join Pull-Lover",
    title: "Create your account.",
    description: "Track your orders and keep your details close at hand.",
    imageAlt: "An artisan’s hands finishing a sweater",
    visualTitle: "Your story with knitwear starts here.",
    visualText: "Made to order, carried by the craft of our family workshop in Antananarivo.",
    name: "Full name",
    namePlaceholder: "Your name",
    email: "Email address",
    emailPlaceholder: "you@example.com",
    password: "Password",
    passwordPlaceholder: "At least 8 characters",
    hidePassword: "Hide password",
    showPassword: "Show password",
    hide: "Hide",
    show: "Show",
    confirm: "Confirm password",
    confirmPlaceholder: "Confirm your password",
    terms: (terms, privacy) => <>I accept the {terms} and the {privacy}.</>,
    termsLink: "terms of sale",
    privacyLink: "privacy policy",
    creating: "Creating…",
    submit: "Create my account",
    hasAccount: "Already have an account?",
    signIn: "Sign in",
  },
};

export default function RegisterPage() {
  const lang = useLang();
  const t = TEXT[lang];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const router = useRouter();

  function getPasswordStrength(pwd) {
    if (!pwd) return null;
    if (!validatePassword(pwd).isValid) return { label: t.weak, color: "#a13b32", width: "33%" };
    if (pwd.length < 10) return { label: t.medium, color: "#9a6b22", width: "66%" };
    return { label: t.strong, color: "#49705e", width: "100%" };
  }

  const strength = getPasswordStrength(password);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessageType("error");
      return setMessage(t.mismatch);
    }
    if (!acceptTerms) {
      setMessageType("error");
      return setMessage(t.acceptTerms);
    }
    if (!validatePassword(password).isValid) {
      setMessageType("error");
      return setMessage(t.tooWeak(passwordHint(lang)));
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, locale: lang }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessageType("error");
        return setMessage(data.message || t.error);
      }
      setMessage(t.created);
      setMessageType("success");
      setTimeout(async () => {
        await signIn("credentials", { email, password, lang, redirect: false });
        router.push(localePath(lang, "/dashboard"));
      }, 1500);
    } catch {
      setMessageType("error");
      setMessage(t.serverError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      variant="register"
      eyebrow={t.eyebrow}
      title={t.title}
      description={t.description}
      image="/api/media/pull-lover-manequin-cardigan-2.webp"
      imageAlt={t.imageAlt}
      visualTitle={t.visualTitle}
      visualText={t.visualText}
    >
      <form className="auth-form" onSubmit={handleSubmit} data-reveal-stagger>
        <div className="auth-fields">
          <div className="auth-field">
            <label htmlFor="register-name">{t.name}</label>
            <div className="auth-input-wrap">
              <input
                id="register-name"
                type="text"
                placeholder={t.namePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="register-email">{t.email}</label>
            <div className="auth-input-wrap">
              <input
                id="register-email"
                type="email"
                placeholder={t.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="register-password">{t.password}</label>
            <div className="auth-input-wrap">
              <input
                id="register-password"
                type={showPwd ? "text" : "password"}
                placeholder={t.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
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
            {strength && (
              <div className="auth-strength">
                <div className="auth-strength-bar" aria-hidden="true">
                  <div style={{ width: strength.width, background: strength.color }} />
                </div>
                <span style={{ color: strength.color }}>{t.security(strength.label)}</span>
              </div>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="register-confirm-password">{t.confirm}</label>
            <div className="auth-input-wrap">
              <input
                id="register-confirm-password"
                type={showConfirmPwd ? "text" : "password"}
                placeholder={t.confirmPlaceholder}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
              <button
                className="auth-password-toggle"
                type="button"
                aria-label={showConfirmPwd ? t.hidePassword : t.showPassword}
                onClick={() => setShowConfirmPwd(!showConfirmPwd)}
              >
                {showConfirmPwd ? t.hide : t.show}
              </button>
            </div>
          </div>
        </div>

        <label className="auth-terms">
          <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
          <span>
            {t.terms(
              <Link href={localePath(lang, "/conditions-de-vente")}>{t.termsLink}</Link>,
              <Link href={localePath(lang, "/politique-de-confidentialite")}>{t.privacyLink}</Link>
            )}
          </span>
        </label>

        {message && <p className={`auth-message ${messageType}`} role="status">{message}</p>}

        <ButtonPrimary className="auth-submit" full type="submit" disabled={loading}>
          {loading ? t.creating : t.submit}
        </ButtonPrimary>

        {/* Google désactivé temporairement (redirect_uri_mismatch), à remettre plus tard
        <div className="auth-divider" aria-hidden="true">
          <span /><p>Ou s’inscrire avec</p><span />
        </div>

        <button className="auth-google" type="button" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
          Continuer avec Google
        </button>
        */}

        <div className="auth-switch">
          <p>{t.hasAccount}</p>
          <Link href={localePath(lang, "/auth/login")}>{t.signIn}</Link>
        </div>
      </form>
    </AuthShell>
  );
}
