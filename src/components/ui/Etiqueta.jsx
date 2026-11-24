export function Etiqueta({ clara, naranja, children }) {
  const clase = [
    "etiqueta",
    clara && "etiqueta--clara",
    naranja && "etiqueta--naranja",
  ]
    .filter(Boolean)
    .join(" ");
  return <p className={clase}>{children}</p>;
}
