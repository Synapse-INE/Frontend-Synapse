import { formatearQuetzales } from "../../data/precios";
import { Etiqueta } from "../../components/ui/Etiqueta";

export function GraficoCotizaciones({ estadisticas }) {
  const { barras = [], mediana = 0, total = 0 } = estadisticas || {};
  const ref = barras.find((b) => b.referencia);

  return (
    <article className="panel panel--caso revelar">
      <div className="panel__cab">
        <div>
          <Etiqueta>Consulta</Etiqueta>
          <h2>Precios de esta búsqueda</h2>
          <p>{total ? "Hasta cinco renglones. La línea naranja es la mediana." : "Sin renglones en esta consulta."}</p>
        </div>
        <div className="dato-grande">
          <span>Mediana</span>
          <strong>{total ? formatearQuetzales(mediana) : "—"}</strong>
        </div>
      </div>
      <div className="panel__graf">
        {barras.length ? (
          <div
            className="v-chart"
            role="img"
            aria-label={`Precios de la consulta. Mediana ${formatearQuetzales(mediana)}.`}
          >
            {ref ? <span className="v-chart__ref" style={{ "--y": `${ref.altura}%` }} /> : null}
            {barras.map((item) => (
              <div className={`v-col${item.referencia ? " es-ref" : ""}`} key={item.id}>
                <b>{item.monto.toLocaleString("es-GT")}</b>
                <div className="v-plot">
                  <i style={{ "--h": `${item.altura}%` }} />
                </div>
                <span>{item.etiqueta}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="panel__vacio">Sin datos para graficar.</p>
        )}
      </div>
    </article>
  );
}
