"use client";

import Link from "next/link";
import { useLang } from "@/app/i18n/I18nProvider";
import { localePath } from "@/app/i18n/config.mjs";
import styles from "./not-found.module.css";

// not-found ne reçoit pas les paramètres de route : la langue vient du layout (I18nProvider)
const TEXT = {
  fr: {
    pageTitle: "Page introuvable | Pull-Lover",
    code: "Erreur 404",
    title: "Cette maille s'est perdue en chemin.",
    text: "La page que vous cherchez n'existe pas ou a été déplacée.",
    home: "Retour à l'accueil",
    discover: "Découvrir le cardigan",
  },
  en: {
    pageTitle: "Page not found | Pull-Lover",
    code: "Error 404",
    title: "This stitch got lost along the way.",
    text: "The page you're looking for doesn't exist or has been moved.",
    home: "Back to home",
    discover: "Discover the cardigan",
  },
};

export default function NotFound() {
  const lang = useLang();
  const t = TEXT[lang];
  return (
    <section className={styles.page}>
      <title>{t.pageTitle}</title>
      <p className={styles.code}>{t.code}</p>
      <h1 className={styles.title}>{t.title}</h1>
      <p className={styles.text}>{t.text}</p>
      <div className={styles.actions}>
        <Link href={localePath(lang, "/")} className={styles.button}>{t.home}</Link>
        <Link href={localePath(lang, "/#piece")} className={`${styles.button} ${styles.buttonGhost}`}>
          {t.discover}
        </Link>
      </div>
    </section>
  );
}
