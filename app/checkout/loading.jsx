import "./checkout.css";

export default function CheckoutLoading() {
  return (
    <div className="checkout-page checkout-loading" aria-busy="true" aria-label="Chargement de la commande">
      <div className="checkout-inner">
        <div className="checkout-loading-header">
          <span className="checkout-skeleton checkout-skeleton-back" />
          <span className="checkout-skeleton checkout-skeleton-eyebrow" />
          <div className="checkout-loading-heading">
            <div>
              <span className="checkout-skeleton checkout-skeleton-title" />
              <span className="checkout-skeleton checkout-skeleton-title checkout-skeleton-title-short" />
            </div>
            <div>
              <span className="checkout-skeleton checkout-skeleton-copy" />
              <span className="checkout-skeleton checkout-skeleton-copy checkout-skeleton-copy-short" />
            </div>
          </div>
        </div>

        <div className="checkout-loading-grid">
          <div className="checkout-loading-form">
            {[0, 1, 2, 3].map((section) => (
              <div className="checkout-loading-section" key={section}>
                <span className="checkout-skeleton checkout-skeleton-section-title" />
                <span className="checkout-skeleton checkout-skeleton-label" />
                <span className="checkout-skeleton checkout-skeleton-input" />
                {section === 1 && <span className="checkout-skeleton checkout-skeleton-input" />}
              </div>
            ))}
          </div>
          <aside className="checkout-loading-summary">
            <span className="checkout-skeleton checkout-skeleton-label" />
            <span className="checkout-skeleton checkout-skeleton-summary-title" />
            {[0, 1].map((item) => (
              <div className="checkout-loading-item" key={item}>
                <span className="checkout-skeleton checkout-skeleton-image" />
                <span className="checkout-skeleton checkout-skeleton-copy" />
              </div>
            ))}
          </aside>
        </div>
      </div>
    </div>
  );
}
