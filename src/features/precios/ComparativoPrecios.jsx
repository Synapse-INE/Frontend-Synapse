import { formatearQuetzales } from "../../data/precios";

export function ComparativoPrecios({ items }) {
  return (
    <div className="h-bars" aria-label="Comparación de precios de referencia">
      {items.map((item) => (
        <article className="h-row revelar" key={item.id}>
          <span>{item.corto}</span>
          <strong>{formatearQuetzales(item.precio)}</strong>
          <div className="track">
            <i style={{ "--p": `${item.comparativo}%` }} />
          </div>
        </article>
      ))}
    </div>
  );
}
