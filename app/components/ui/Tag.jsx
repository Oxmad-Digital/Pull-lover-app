import "./Tag.css";

export function Eyebrow({ children, className = "" }) {
  return (
    <p className={`eyebrow${className ? ` ${className}` : ""}`}>
      {children}
    </p>
  );
}

export function BadgePromo({ children, className = "" }) {
  return (
    <span className={`badge-promo${className ? ` ${className}` : ""}`}>
      {children}
    </span>
  );
}
