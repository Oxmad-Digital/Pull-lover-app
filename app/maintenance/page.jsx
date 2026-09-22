import styles from "./maintenance.module.css";

export const metadata = {
  title: "Site en construction",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <p className={styles.logo}>Pull Lover</p>
        <div className={styles.icon}>🧶</div>
        <h1 className={styles.title}>Le site est en cours de construction</h1>
        <p className={styles.text}>
          Nous préparons quelque chose de tout doux. Le site sera bientôt disponible,
          merci de votre patience !
        </p>
      </div>
    </div>
  );
}
