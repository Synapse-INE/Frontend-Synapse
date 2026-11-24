import { Link } from "react-router-dom";

export function Boton({
  to,
  href,
  variante = "azul",
  bloque = false,
  className = "",
  type = "button",
  children,
  ...props
}) {
  const clases = ["btn", `btn--${variante}`, bloque && "btn--bloque", className]
    .filter(Boolean)
    .join(" ");

  if (to) {
    return (
      <Link to={to} className={clases} {...props}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={clases} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} className={clases} {...props}>
      {children}
    </button>
  );
}
