// Iconos de trazo (24x24, currentColor). Un solo lugar para mantenerlos consistentes.
function Icono({ children, className = "", ...props }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconoCorreo = (p) => (
  <Icono {...p}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="3" />
    <path d="m5 8 7 5 7-5" />
  </Icono>
);

export const IconoCandado = (p) => (
  <Icono {...p}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="3" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </Icono>
);

export const IconoOjo = (p) => (
  <Icono {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </Icono>
);

export const IconoOjoCerrado = (p) => (
  <Icono {...p}>
    <path d="M4 4 20 20" />
    <path d="M9.9 5.8A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.6 3.3M6.4 7.9A15.7 15.7 0 0 0 2.5 12S6 18.5 12 18.5c1.3 0 2.5-.3 3.5-.8" />
  </Icono>
);

export const IconoCheck = ({ dibujar = false, ...p }) => (
  <Icono {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" pathLength="1" className={dibujar ? "lg-trazo" : undefined} />
  </Icono>
);

export const IconoAlerta = (p) => (
  <Icono {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5M12 16.2v.1" />
  </Icono>
);
