"use client";

import { useState } from "react";
import Link from "next/link";
import { ButtonPrimary } from "../../components/ui/Button";
import "../login/login.css";

export default function ForgotPasswordPage() {
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
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.message || "Une erreur est survenue.");
      } else {
        setStatus("success");
        setMessage(data.message);
      }
    } catch {
      setStatus("error");
      setMessage("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg">
        <span /><span /><span /><span />
      </div>

      <div className="login-card">
        <div style={{ marginBottom: 4 }}>
          <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: "#111", fontFamily: "'Montserrat', sans-serif" }}>
            Mot de passe oublié
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "#555", fontFamily: "'Montserrat', sans-serif", lineHeight: 1.6 }}>
            Entrez votre adresse email. Nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
        </div>

        {status === "success" ? (
          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "18px 20px" }}>
            <p style={{ margin: "0 0 12px", fontSize: 14, color: "#166534", fontFamily: "'Montserrat', sans-serif", lineHeight: 1.6 }}>
              {message}
            </p>
            <Link
              href="/auth/login"
              style={{ fontSize: 13, color: "#C75C5C", fontWeight: 600, fontFamily: "'Montserrat', sans-serif", textDecoration: "none" }}
            >
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="login-inputs">
              <div className="login-field">
                <label htmlFor="fp-email">Adresse e-mail</label>
                <div className="login-input-wrap">
                  <span aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                    </svg>
                  </span>
                  <input
                    id="fp-email"
                    type="email"
                    placeholder="Tom.exemple@gmail.com"
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
                {loading ? "Envoi en cours..." : "Envoyer le lien"}
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
