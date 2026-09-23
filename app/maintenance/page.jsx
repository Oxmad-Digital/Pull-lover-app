import Image from "next/image";
import styles from "./maintenance.module.css";

export const metadata = {
  title: "Une maille se prépare",
  description:
    "Pull-Lover prépare sa nouvelle expérience. Notre maille de Madagascar revient bientôt.",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <section className={styles.page} aria-labelledby="maintenance-title">
      <div className={styles.content}>
        <p className={styles.logo} aria-label="Pull-Lover">
          pull<span aria-hidden="true">—</span>lover
        </p>

        <div className={styles.message}>
          <p className={styles.eyebrow}>Maille de Madagascar</p>
          <h1 id="maintenance-title" className={styles.title}>
            Une nouvelle maille <em>se prépare.</em>
          </h1>
          <p className={styles.text}>
            Notre atelier met les dernières finitions à la nouvelle expérience
            Pull-Lover. Nous revenons bientôt, avec le même goût du temps et du
            geste juste.
          </p>
        </div>

        <div className={styles.footer}>
          <span className={styles.line} aria-hidden="true" />
          <p>Imaginé et fabriqué à Madagascar</p>
        </div>
      </div>

      <div className={styles.visual} aria-hidden="true">
        <Image
          src="/api/media/site/mantasoa-hero.webp"
          alt=""
          fill
          sizes="(max-width: 799px) 100vw, 50vw"
          priority
          className={styles.image}
        />
        <div className={styles.imageLabel}>
          <span>Le Mantasoa</span>
          <span>Bientôt disponible</span>
        </div>
      </div>
    </section>
  );
}
