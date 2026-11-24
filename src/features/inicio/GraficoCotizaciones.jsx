import { COTIZACIONES_CASO, formatearQuetzales, PRECIO_REFERENCIA_CASO } from "../../data/precios";
import { Etiqueta } from "../../components/ui/Etiqueta";

export function GraficoCotizaciones() {
  return (
    <article className="panel panel--caso revelar">
      <div className="panel__cab">
        <div>
          <Etiqueta>Caso de la presentación</Etiqueta>
          <h2>500 laptops para el MINEDUC</h2>
          <p>Cinco cotizaciones. La línea naranja es el precio de referencia.</p>
        </div>
        <div className="dato-grande">
          <span>Referencia</span>
          <strong>{formatearQuetzales(PRECIO_REFERENCIA_CASO)}</strong>
        </div>
      </div>
      <div className="panel__graf">
        <div
          className="v-chart"
          role="img"
          aria-label={`Cotizaciones de Q4,200 a Q5,400. Referencia ${formatearQuetzales(PRECIO_REFERENCIA_CASO)}.`}
        >
          <span className="v-chart__ref" style={{ "--y": "72%" }} />
          {COTIZACIONES_CASO.map((item) => (
            <div className={`v-col${item.referencia ? " es-ref" : ""}`} key={item.proveedor}>
              <b>{item.monto.toLocaleString("es-GT")}</b>
              <div className="v-plot">
                <i style={{ "--h": `${item.altura}%` }} />
              </div>
              <span>{item.proveedor}</span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
