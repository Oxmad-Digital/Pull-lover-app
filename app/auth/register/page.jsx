"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ButtonPrimary } from "../../components/ui/Button";
import AuthShell from "../AuthShell";
import "../auth.css";

export default function RegisterPage() {
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
    if (pwd.length < 6) return { label: "Faible", color: "#a13b32", width: "33%" };
    if (pwd.length < 10) return { label: "Moyen", color: "#9a6b22", width: "66%" };
    return { label: "Fort", color: "#49705e", width: "100%" };
  }

  const strength = getPasswordStrength(password);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessageType("error");
      return setMessage("Les mots de passe ne correspondent pas");
    }
    if (!acceptTerms) {
      setMessageType("error");
      return setMessage("Vous devez accepter les conditions");
    }
    if (password.length < 6) {
      setMessageType("error");
      return setMessage("Mot de passe trop court (min. 6 caractères)");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessageType("error");
        return setMessage(data.message || "Erreur");
      }
      setMessage("Compte créé ! Redirection…");
      setMessageType("success");
      setTimeout(async () => {
        await signIn("credentials", { email, password, redirect: false });
        router.push("/dashboard");
      }, 1500);
    } catch {
      setMessageType("error");
      setMessage("Erreur serveur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      variant="register"
      eyebrow="Rejoindre Pull-Lover"
      title="Créer votre espace."
      description="Suivez vos commandes et gardez vos informations à portée de main."
      image="/api/media/site/atelier-maille.webp"
      imageAlt="Les mains d’une artisane pendant les finitions d’un pull"
      visualTitle="Votre histoire avec la maille commence ici."
      visualText="Une fabrication à la demande, portée par les gestes de notre atelier familial à Antananarivo."
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-fields">
          <div className="auth-field">
            <label htmlFor="register-name">Nom complet</label>
            <div className="auth-input-wrap">
              <input
                id="register-name"
                type="text"
                placeholder="Votre nom"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="register-email">Adresse e-mail</label>
            <div className="auth-input-wrap">
              <input
                id="register-email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="register-password">Mot de passe</label>
            <div className="auth-input-wrap">
              <input
                id="register-password"
                type={showPwd ? "text" : "password"}
                placeholder="6 caractères minimum"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
              <button
                className="auth-password-toggle"
                type="button"
                aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                onClick={() => setShowPwd(!showPwd)}
              >
                {showPwd ? "Masquer" : "Afficher"}
              </button>
            </div>
            {strength && (
              <div className="auth-strength">
                <div className="auth-strength-bar" aria-hidden="true">
                  <div style={{ width: strength.width, background: strength.color }} />
                </div>
                <span style={{ color: strength.color }}>Sécurité {strength.label.toLowerCase()}</span>
              </div>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="register-confirm-password">Confirmer le mot de passe</label>
            <div className="auth-input-wrap">
              <input
                id="register-confirm-password"
                type={showConfirmPwd ? "text" : "password"}
                placeholder="Confirmez votre mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
              <button
                className="auth-password-toggle"
                type="button"
                aria-label={showConfirmPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                onClick={() => setShowConfirmPwd(!showConfirmPwd)}
              >
                {showConfirmPwd ? "Masquer" : "Afficher"}
              </button>
            </div>
          </div>
        </div>

        <label className="auth-terms">
          <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
          <span>
            J’accepte les <Link href="/conditions-de-vente">conditions de vente</Link> et la{" "}
            <Link href="/politique-de-confidentialite">politique de confidentialité</Link>.
          </span>
        </label>

        {message && <p className={`auth-message ${messageType}`} role="status">{message}</p>}

        <ButtonPrimary className="auth-submit" full type="submit" disabled={loading}>
          {loading ? "Création…" : "Créer mon compte"}
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
          <p>Vous avez déjà un compte ?</p>
          <Link href="/auth/login">Se connecter</Link>
        </div>
      </form>
    </AuthShell>
  );
}
