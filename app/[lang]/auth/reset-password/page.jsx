"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ButtonPrimary } from "@/app/components/ui/Button";
import { passwordHint, validatePassword } from "@/app/lib/password";
import { useLang } from "@/app/i18n/I18nProvider";
import { localePath } from "@/app/i18n/config.mjs";
import "../login/login.css";

const TEXT = {
  fr: {
    invalidLink: "Lien invalide. Veuillez faire une nouvelle demande de réinitialisation.",
    mismatch: "Les mots de passe ne correspondent pas.",
    tooWeak: (hint) => `Mot de passe trop faible : ${hint}.`,
    error: "Une erreur est survenue.",
    retry: "Une erreur est survenue. Veuillez réessayer.",
    title: "Nouveau mot de passe",
    intro: "Choisissez un nouveau mot de passe pour votre compte.",
    redirecting: "Redirection vers la connexion...",
    newPassword: "Nouveau mot de passe",
    confirm: "Confirmer le mot de passe",
    hide: "Masquer",
    show: "Afficher",
    saving: "Enregistrement...",
    save: "Enregistrer le mot de passe",
    remember: "Vous vous souvenez ?",
    signIn: "Se connecter",
  },
  en: {
    invalidLink: "Invalid link. Please request a new password reset.",
    mismatch: "Passwords don’t match.",
    tooWeak: (hint) => `Password too weak: ${hint}.`,
    error: "Something went wrong.",
    retry: "Something went wrong. Please try again.",
    title: "New password",
    intro: "Choose a new password for your account.",
    redirecting: "Redirecting to sign in...",
    newPassword: "New password",
    confirm: "Confirm password",
    hide: "Hide",
    show: "Show",
    saving: "Saving...",
    save: "Save password",
    remember: "Remember it?",
    signIn: "Sign in",
  },
};

function ResetPasswordForm() {
  const lang = useLang();
  const t = TEXT[lang];
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState(null); // "success" | "error"
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage(t.invalidLink);
    }
  }, [token, t]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== confirm) {
      setStatus("error");
      setMessage(t.mismatch);
      return;
    }

    if (!validatePassword(password).isValid) {
      setStatus("error");
      setMessage(t.tooWeak(passwordHint(lang)));
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, locale: lang }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.message || t.error);
      } else {
        setStatus("success");
        setMessage(data.message);
        setTimeout(() => router.push(localePath(lang, "/auth/login")), 3000);
      }
    } catch {
      setStatus("error");
      setMessage(t.retry);
    } finally {
      setLoading(false);
    }
  }

  const EyeIcon = ({ open }) => open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );

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
            <p style={{ margin: 0, fontSize: 13, color: "#555", fontFamily: "'Montserrat', sans-serif" }}>
              {t.redirecting}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="login-inputs">
              <div className="login-field">
                <label htmlFor="rp-password">{t.newPassword}</label>
                <div className="login-input-wrap">
                  <span aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="rp-password"
                    type={showPwd ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button type="button" aria-label={showPwd ? t.hide : t.show} onClick={() => setShowPwd(!showPwd)}>
                    <EyeIcon open={showPwd} />
                  </button>
                </div>
              </div>

              <div className="login-field">
                <label htmlFor="rp-confirm">{t.confirm}</label>
                <div className="login-input-wrap">
                  <span aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="rp-confirm"
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button type="button" aria-label={showConfirm ? t.hide : t.show} onClick={() => setShowConfirm(!showConfirm)}>
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
              </div>
            </div>

            <div className="login-actions" style={{ marginTop: 10 }}>
              {status === "error" && (
                <p className="login-error">{message}</p>
              )}

              <ButtonPrimary full type="submit" disabled={loading || !token}>
                {loading ? t.saving : t.save}
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

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
