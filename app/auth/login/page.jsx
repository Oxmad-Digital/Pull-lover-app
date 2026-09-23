"use client";

import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ButtonPrimary } from "../../components/ui/Button";
import AuthShell from "../AuthShell";
import "../auth.css";

export default function LoginPage() {
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
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) return setError("Email ou mot de passe incorrect");
    const session = await getSession();
    router.push(session?.user?.role === "admin" ? "/admin" : "/dashboard");
  }

  return (
    <AuthShell
      variant="login"
      eyebrow="Votre espace"
      title="Heureux de vous revoir."
      description="Retrouvez vos commandes, vos adresses et les pièces que vous avez choisies."
      image="/api/media/site/mantasoa-hero.webp"
      imageAlt="Le pull Mantasoa porté au bord du lac"
      visualTitle="Des pièces qui traversent le temps."
      visualText="Pensées à Madagascar, tricotées à la demande et faites pour vous accompagner saison après saison."
    >
      <form className="auth-form" onSubmit={handleLogin}>
        <div className="auth-fields">
          <div className="auth-field">
            <label htmlFor="login-email">Adresse e-mail</label>
            <div className="auth-input-wrap">
              <input
                id="login-email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                aria-invalid={Boolean(error)}
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Mot de passe</label>
            <div className="auth-input-wrap">
              <input
                id="login-password"
                type={showPwd ? "text" : "password"}
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                aria-invalid={Boolean(error)}
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
          </div>
        </div>

        <div className="auth-inline-row">
          <label className="auth-check">
            <input type="checkbox" />
            <span>Se souvenir de moi</span>
          </label>
          <Link className="auth-link" href="/auth/forgot-password">Mot de passe oublié</Link>
        </div>

        {error && <p className="auth-error" role="alert">{error}</p>}

        <ButtonPrimary className="auth-submit" full type="submit" disabled={loading}>
          {loading ? "Connexion…" : "Se connecter"}
        </ButtonPrimary>

        <div className="auth-divider" aria-hidden="true">
          <span /><p>Ou continuer avec</p><span />
        </div>

        <button className="auth-google" type="button" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
          Continuer avec Google
        </button>

        <div className="auth-switch">
          <p>Pas encore de compte ?</p>
          <Link href="/auth/register">Créer un compte</Link>
        </div>
      </form>
    </AuthShell>
  );
}
