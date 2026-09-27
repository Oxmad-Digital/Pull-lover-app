"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import "./verify-email.css";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token de vérification manquant");
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage(data.message);
          setTimeout(() => router.push("/auth/login"), 3000);
        } else {
          setStatus("error");
          setMessage(data.message);
        }
      } catch {
        setStatus("error");
        setMessage("Erreur lors de la vérification");
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="verify-page">

      <div className="verify-bg">
        <span /><span /><span /><span />
      </div>

      <div className="verify-card" data-reveal-stagger>

        {status === "loading" && (
          <>
            <div className="verify-spinner" />
            <h1>Vérification en cours…</h1>
            <p>Veuillez patienter quelques instants.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="verify-icon success">✓</div>
            <h1>Email vérifié !</h1>
            <p>{message}</p>
            <p>Vous allez être redirigé vers la connexion…</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="verify-icon error">✕</div>
            <h1>Vérification échouée</h1>
            <p>{message}</p>
            <Link href="/auth/register" className="verify-btn">
              Retour à l&apos;inscription
            </Link>
          </>
        )}

      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="verify-page">
        <div className="verify-card">
          <div className="verify-spinner" />
          <h1>Chargement…</h1>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
