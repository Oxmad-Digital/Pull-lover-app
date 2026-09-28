"use client";

import { useState } from "react";
import Link from "next/link";
import { ButtonPrimary } from "@/app/components/ui/Button";
import { useLang } from "@/app/i18n/I18nProvider";
import { localePath } from "@/app/i18n/config.mjs";
import "../login/login.css";

const TEXT = {
  fr: {
    error: "Une erreur est survenue.",
    retry: "Une erreur est survenue. Veuillez réessayer.",
    title: "Mot de passe oublié",
    intro: "Entrez votre adresse email. Nous vous enverrons un lien pour réinitialiser votre mot de passe.",
    back: "Retour à la connexion",
    email: "Adresse e-mail",
    emailPlaceholder: "vous@exemple.com",
    sending: "Envoi en cours...",
    send: "Envoyer le lien",
    remember: "Vous vous souvenez ?",
    signIn: "Se connecter",
  },
  en: {
    error: "Something went wrong.",
    retry: "Something went wrong. Please try again.",
    title: "Forgot password",
    intro: "Enter your email address. We’ll send you a link to reset your password.",
    back: "Back to sign in",
    email: "Email address",
    emailPlaceholder: "you@example.com",
    sending: "Sending...",
    send: "Send the link",
    remember: "Remember it?",
    signIn: "Sign in",
  },
};

export default function ForgotPasswordPage() {
  const lang = useLang();
  const t = TEXT[lang];
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null); // "success" | "error"
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale: lang }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.message || t.error);
      } else {
        setStatus("success");
        setMessage(data.message);
      }
    } catch {
      setStatus("error");
      setMessage(t.retry);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg">
        <span /><span /><span /><span />
      </div>

      <div className="login-card" data-reveal-stagger>
        <div style={{ marginBottom: 4 }}>
          <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: "#111", fontFamily: "'Montserrat', sans-serif" }}>
            {t.title}
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "#555", fontFamily: "'Montserrat', sans-serif", lineHeight: 1.6 }}>
            {t.intro}
          </p>
        </div>

        {status === "success" ? (
          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "18px 20px" }}>
            <p style={{ margin: "0 0 12px", fontSize: 14, color: "#166534", fontFamily: "'Montserrat', sans-serif", lineHeight: 1.6 }}>
              {message}
            </p>
            <Link
              href={localePath(lang, "/auth/login")}
              style={{ fontSize: 13, color: "#C75C5C", fontWeight: 600, fontFamily: "'Montserrat', sans-serif", textDecoration: "none" }}
            >
              {t.back}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="login-inputs">
              <div className="login-field">
                <label htmlFor="fp-email">{t.email}</label>
                <div className="login-input-wrap">
                  <span aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                    </svg>
                  </span>
                  <input
                    id="fp-email"
                    type="email"
                    placeholder={t.emailPlaceholder}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="login-actions" style={{ marginTop: 10 }}>
              {status === "error" && (
                <p className="login-error">{message}</p>
              )}

              <ButtonPrimary full type="submit" disabled={loading}>
                {loading ? t.sending : t.send}
              </ButtonPrimary>
            </div>
          </form>
        )}

        <div className="login-footer">
          <p>{t.remember}</p>
          <Link href={localePath(lang, "/auth/login")}>{t.signIn}</Link>
        </div>
      </div>
    </div>
  );
}
