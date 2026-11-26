import { formatearQuetzales } from "../../data/precios";

export function ComparativoPrecios({ items }) {
  if (!items?.length) {
    return <p className="nota">No hay renglones que coincidan con la consulta.</p>;
  }

  return (
    <div className="h-bars" aria-label="Comparación de precios de la consulta">
      {items.map((item) => (
        <article className="h-row revelar" key={item.id}>
          <span>{item.producto}</span>
          <strong>{formatearQuetzales(item.precio)}</strong>
          <div className="track">
            <i style={{ "--p": `${item.comparativo}%` }} />
          </div>
        </article>
      ))}
    </div>
  );
}
