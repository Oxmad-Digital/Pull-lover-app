import Link from "next/link";
import styles from "./not-found.module.css";

export const metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <section className={styles.page}>
      <p className={styles.code}>Erreur 404</p>
      <h1 className={styles.title}>Cette maille s&apos;est perdue en chemin.</h1>
      <p className={styles.text}>
        La page que vous cherchez n&apos;existe pas ou a été déplacée.
      </p>
      <div className={styles.actions}>
        <Link href="/" className={styles.button}>Retour à l&apos;accueil</Link>
        <Link href="/#piece" className={`${styles.button} ${styles.buttonGhost}`}>
          Découvrir le cardigan
        </Link>
      </div>
    </section>
  );
}
