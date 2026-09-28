import "./Tag.css";

export function BadgePromo({ children, className = "" }) {
  return (
    <span className={`badge-promo${className ? ` ${className}` : ""}`}>
      {children}
    </span>
  );
}
