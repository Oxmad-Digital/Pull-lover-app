"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/app/i18n/I18nProvider";
import { localePath } from "@/app/i18n/config.mjs";
import "./verify-email.css";

const TEXT = {
  fr: {
    missingToken: "Token de vérification manquant",
    verifyError: "Erreur lors de la vérification",
    verifying: "Vérification en cours…",
    wait: "Veuillez patienter quelques instants.",
    verified: "Email vérifié !",
    redirecting: "Vous allez être redirigé vers la connexion…",
    failed: "Vérification échouée",
    back: "Retour à l'inscription",
    loading: "Chargement…",
  },
  en: {
    missingToken: "Missing verification token",
    verifyError: "Something went wrong during verification",
    verifying: "Verifying…",
    wait: "Please wait a moment.",
    verified: "Email verified!",
    redirecting: "You’ll be redirected to sign in…",
    failed: "Verification failed",
    back: "Back to sign up",
    loading: "Loading…",
  },
};

function VerifyEmailContent() {
  const lang = useLang();
  const t = TEXT[lang];
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage(t.missingToken);
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}&locale=${lang}`);
        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage(data.message);
          setTimeout(() => router.push(localePath(lang, "/auth/login")), 3000);
        } else {
          setStatus("error");
          setMessage(data.message);
        }
      } catch {
        setStatus("error");
        setMessage(t.verifyError);
      }
    };

    verifyEmail();
  }, [token, router, lang, t]);

  return (
    <div className="verify-page">

      <div className="verify-bg">
        <span /><span /><span /><span />
      </div>

      <div className="verify-card" data-reveal-stagger>

        {status === "loading" && (
          <>
            <div className="verify-spinner" />
            <h1>{t.verifying}</h1>
            <p>{t.wait}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="verify-icon success">✓</div>
            <h1>{t.verified}</h1>
            <p>{message}</p>
            <p>{t.redirecting}</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="verify-icon error">✕</div>
            <h1>{t.failed}</h1>
            <p>{message}</p>
            <Link href={localePath(lang, "/auth/register")} className="verify-btn">
              {t.back}
            </Link>
          </>
        )}

      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  const t = TEXT[useLang()];
  return (
    <Suspense fallback={
      <div className="verify-page">
        <div className="verify-card">
          <div className="verify-spinner" />
          <h1>{t.loading}</h1>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
