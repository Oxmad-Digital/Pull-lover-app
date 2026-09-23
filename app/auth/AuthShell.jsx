import Image from "next/image";

export default function AuthShell({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  visualTitle,
  visualText,
  variant,
  children,
}) {
  return (
    <section className={`auth-page auth-page-${variant}`}>
      <div className="auth-visual">
        <Image
          src={image}
          alt={imageAlt}
          fill
          priority
          sizes="(max-width: 939px) 100vw, 52vw"
        />
        <div className="auth-visual-copy">
          <p className="auth-eyebrow">Maille de Madagascar</p>
          <h2>{visualTitle}</h2>
          <p>{visualText}</p>
        </div>
        <p className="auth-origin">Atelier familial · Antananarivo</p>
      </div>

      <div className="auth-content">
        <div className="auth-panel">
          <header className="auth-heading">
            <p className="auth-eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p>{description}</p>
          </header>
          {children}
        </div>
      </div>
    </section>
  );
}
