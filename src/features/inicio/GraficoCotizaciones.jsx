import { Etiqueta } from "../../components/ui/Etiqueta";
import { tituloCategoria } from "../precios/tituloCategoria";

export function GraficoCotizaciones({ resumen }) {
  const categorias = resumen?.categorias || [];
  const maximo = Math.max(1, ...categorias.map((fila) => Number(fila.n) || 0));
  const principal = categorias[0];

  return (
    <article className="panel panel--caso revelar">
      <div className="panel__cab">
        <div>
          <Etiqueta>Catálogo</Etiqueta>
          <h2>Dónde hay más precios</h2>
          <p>{categorias.length ? "Las cinco categorías con más renglones publicados." : "Sin categorías en la publicación."}</p>
        </div>
        <div className="dato-grande">
          <span>Principal</span>
          <strong>{principal ? `${principal.porcentaje}%` : "—"}</strong>
        </div>
      </div>
      <div className="panel__graf">
        {categorias.length ? (
          <ol className="ranking" aria-label="Categorías con más precios de referencia publicados.">
            {categorias.map((fila) => (
              <li key={fila.etiqueta}>
                <span className="ranking__nombre" title={tituloCategoria(fila.etiqueta)}>{tituloCategoria(fila.etiqueta)}</span>
                <span className="ranking__pista" aria-hidden="true">
                  <i style={{ "--p": `${Math.max(8, (fila.n / maximo) * 100)}%` }} />
                </span>
                <b>{Number(fila.n).toLocaleString("es-GT")}</b>
              </li>
            ))}
          </ol>
        ) : (
          <p className="panel__vacio">{resumen?.cargando ? "Cargando la publicación…" : "Sin datos para graficar."}</p>
        )}
      </div>
    </article>
  );
}
