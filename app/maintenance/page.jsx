import Image from "next/image";
import styles from "./maintenance.module.css";

export const metadata = {
  title: "Bientôt de retour | Pull-Lover",
  description: "Pull-Lover revient bientôt.",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <main className={styles.page}>
      <Image
        src="/pull-lover_logo_coeur_rouge-transparent.webp"
        alt="Pull-Lover"
        width={160}
        height={160}
        priority
        className={styles.logo}
      />
      <h1 className={styles.title}>Bientôt de retour.</h1>
      <p className={styles.text}>Notre site est en cours de préparation.</p>
    </main>
  );
}
