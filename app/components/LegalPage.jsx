import "./LegalPage.css";

export function LegalPage({ eyebrow = "Informations légales", title, children }) {
  return (
    <article className="pl-legal">
      <header className="pl-legal-hero">
        <div className="pl-legal-hero-inner" data-reveal-stagger>
          <p className="pl-legal-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
        </div>
      </header>

      <div className="pl-legal-content" data-reveal-stagger>{children}</div>
    </article>
  );
}

export function LegalSection({ title, children }) {
  return (
    <section className="pl-legal-section">
      <h2>{title}</h2>
      <div className="pl-legal-copy">{children}</div>
    </section>
  );
}
