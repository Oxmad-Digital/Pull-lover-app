"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ButtonPrimary } from "../../components/ui/Button";
import "../login/login.css";

function ResetPasswordForm() {
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
      setMessage("Lien invalide. Veuillez faire une nouvelle demande de réinitialisation.");
    }
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== confirm) {
      setStatus("error");
      setMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    if (password.length < 6) {
      setStatus("error");
      setMessage("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.message || "Une erreur est survenue.");
      } else {
        setStatus("success");
        setMessage(data.message);
        setTimeout(() => router.push("/auth/login"), 3000);
      }
    } catch {
      setStatus("error");
      setMessage("Une erreur est survenue. Veuillez réessayer.");
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
            Nouveau mot de passe
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "#555", fontFamily: "'Montserrat', sans-serif", lineHeight: 1.6 }}>
            Choisissez un nouveau mot de passe pour votre compte.
          </p>
        </div>

        {status === "success" ? (
          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "18px 20px" }}>
            <p style={{ margin: "0 0 12px", fontSize: 14, color: "#166534", fontFamily: "'Montserrat', sans-serif", lineHeight: 1.6 }}>
              {message}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: "#555", fontFamily: "'Montserrat', sans-serif" }}>
              Redirection vers la connexion...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="login-inputs">
              <div className="login-field">
                <label htmlFor="rp-password">Nouveau mot de passe</label>
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
                    minLength={6}
                  />
                  <button type="button" aria-label={showPwd ? "Masquer" : "Afficher"} onClick={() => setShowPwd(!showPwd)}>
                    <EyeIcon open={showPwd} />
                  </button>
                </div>
              </div>

              <div className="login-field">
                <label htmlFor="rp-confirm">Confirmer le mot de passe</label>
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
                    minLength={6}
                  />
                  <button type="button" aria-label={showConfirm ? "Masquer" : "Afficher"} onClick={() => setShowConfirm(!showConfirm)}>
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
                {loading ? "Enregistrement..." : "Enregistrer le mot de passe"}
              </ButtonPrimary>
            </div>
          </form>
        )}

        <div className="login-footer">
          <p>Vous vous souvenez ?</p>
          <Link href="/auth/login">Se connecter</Link>
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
