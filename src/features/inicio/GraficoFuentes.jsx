import { FUENTES_ESTUDIO } from "../../data/precios";
import { Etiqueta } from "../../components/ui/Etiqueta";

export function GraficoFuentes() {
  return (
    <article className="panel panel--dona revelar">
      <div className="panel__cab">
        <div>
          <Etiqueta>Origen de los datos</Etiqueta>
          <h2>Fuentes del estudio</h2>
          <p>Se recomienda que más del 50% provenga del mercado relevante.</p>
        </div>
        <div className="dato-grande dato-grande--lima">
          <span>Mercado</span>
          <strong>+50%</strong>
        </div>
      </div>
      <div className="panel__graf">
        <div className="dona-wrap">
          <svg className="dona" viewBox="0 0 200 200" aria-hidden="true">
            <circle className="dona-fondo" cx="100" cy="100" r="72" />
            <circle className="dona-a" cx="100" cy="100" r="72" />
            <circle className="dona-b" cx="100" cy="100" r="72" />
            <circle className="dona-c" cx="100" cy="100" r="72" />
            <text x="100" y="96" className="dona-num">
              +50%
            </text>
            <text x="100" y="116" className="dona-sub">
              mercado
            </text>
          </svg>
          <ul className="leyenda">
            {FUENTES_ESTUDIO.map((fuente) => (
              <li key={fuente.clave}>
                <i className={`sw ${fuente.clase}`} />
                <span className="leyenda__full">{fuente.etiqueta}</span>
                <span className="leyenda__corto">{fuente.corto}</span>
                <b>{fuente.porcentaje}%</b>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
