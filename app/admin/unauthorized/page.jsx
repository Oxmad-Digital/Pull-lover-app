import Link from "next/link";
import styles from "./unauthorized.module.css";

export default function UnauthorizedPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}>🚫</div>

        <h1 className={styles.title}>Acc�s refus�</h1>

        <p className={styles.text}>
          Cette zone est r�serv�e aux administrateurs.
          Vous n�avez pas les autorisations n�cessaires.
        </p>

        <div className={styles.actions}>
          <Link href="/" className={styles.buttonPrimary}>
            Retour � l�accueil
          </Link>

          <Link href="/auth/login" className={styles.buttonSecondary}>
            Se connecter avec un autre compte
          </Link>
        </div>
      </div>
    </div>
  );
}
