export default function AdminLoading() {
  return (
    <div className="admin-skeleton" aria-label="Chargement de l'administration" aria-busy="true">
      <div className="admin-skeleton-topbar">
        <span className="admin-skeleton-title" />
        <span className="admin-skeleton-action" />
      </div>

      <div className="admin-skeleton-table">
        <div className="admin-skeleton-head" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="admin-skeleton-row">
            <span style={{ width: `${120 + (i % 3) * 40}px` }} />
            <span className="admin-skeleton-row-end" />
          </div>
        ))}
      </div>
    </div>
  );
}
