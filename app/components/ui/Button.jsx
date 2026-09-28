import Link from "next/link";
import "./Button.css";

function buildClass(variant, size, full, extra) {
  return [
    "btn",
    `btn-${variant}`,
    size === "sm" && "btn-sm",
    size === "lg" && "btn-lg",
    full && "btn-full",
    extra,
  ].filter(Boolean).join(" ");
}

function Btn({ variant, size, full, children, href, onClick, type = "button", disabled, className = "", ...props }) {
  const cls = buildClass(variant, size, full, className);
  if (href) {
    return <Link href={href} className={cls} {...props}>{children}</Link>;
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls} {...props}>
      {children}
    </button>
  );
}

export function ButtonPrimary(props) { return <Btn variant="primary" {...props} />; }
export function ButtonSecondary(props) { return <Btn variant="secondary" {...props} />; }
