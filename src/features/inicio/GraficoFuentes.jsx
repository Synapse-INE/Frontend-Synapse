import { Etiqueta } from "../../components/ui/Etiqueta";

export function GraficoFuentes({ estadisticas }) {
  const { metodos = [], principal, total = 0 } = estadisticas || {};

  return (
    <article className="panel panel--dona revelar">
      <div className="panel__cab">
        <div>
          <Etiqueta>Modalidad</Etiqueta>
          <h2>Cómo se compró</h2>
          <p>{total ? "Modalidades de compra en esta consulta." : "Sin renglones en esta consulta."}</p>
        </div>
        <div className="dato-grande dato-grande--lima">
          <span>{principal?.etiqueta ?? "Modalidad"}</span>
          <strong>{principal ? `${principal.porcentaje}%` : "—"}</strong>
        </div>
      </div>
      <div className="panel__graf">
        {metodos.length ? (
          <div className="dona-wrap">
            <svg className="dona" viewBox="0 0 200 200" aria-hidden="true">
              <circle className="dona-fondo" cx="100" cy="100" r="72" />
              {metodos.map((metodo, i) => (
                <circle
                  key={metodo.clave}
                  className={`dona-a dona-${["a", "b", "c"][i]}`}
                  cx="100"
                  cy="100"
                  r="72"
                  style={{
                    strokeDasharray: `${metodo.largo} ${metodo.circunferencia}`,
                    strokeDashoffset: -metodo.offset,
                  }}
                />
              ))}
              <text x="100" y="96" className="dona-num">
                {principal ? `${principal.porcentaje}%` : ""}
              </text>
              <text x="100" y="116" className="dona-sub">
                {principal?.etiqueta ?? ""}
              </text>
            </svg>
            <ul className="leyenda">
              {metodos.map((metodo) => (
                <li key={metodo.clave}>
                  <i className={`sw ${metodo.clase}`} />
                  <span className="leyenda__full">{metodo.etiqueta}</span>
                  <span className="leyenda__corto">{metodo.corto}</span>
                  <b>{metodo.porcentaje}%</b>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="panel__vacio">Sin datos para graficar.</p>
        )}
      </div>
    </article>
  );
}
