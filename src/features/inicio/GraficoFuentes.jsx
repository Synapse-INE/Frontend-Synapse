import { Etiqueta } from "../../components/ui/Etiqueta";

function textoPorcentaje(fila) {
  const valor = Number(fila?.porcentaje);
  if (Number(fila?.n) > 0 && (!valor || valor < 1)) return valor ? `${valor}%` : "<1%";
  return `${valor || 0}%`;
}

export function GraficoFuentes({ resumen }) {
  const metodos = resumen?.metodos || [];
  const principal = metodos[0];
  const total = resumen?.total || 0;

  return (
    <article className="panel panel--dona revelar">
      <div className="panel__cab">
        <div>
          <Etiqueta>Modalidad</Etiqueta>
          <h2>Cómo se compró</h2>
          <p>{total ? "Modalidad de compra de los precios publicados." : "Sin renglones publicados."}</p>
        </div>
        <div className="dato-grande dato-grande--lima">
          <span>{principal?.etiqueta ?? "Modalidad"}</span>
          <strong>{principal ? textoPorcentaje(principal) : "—"}</strong>
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
                  className={`dona-pub dona-pub--${["a", "b", "c"][i] || "c"}`}
                  cx="100"
                  cy="100"
                  r="72"
                  style={{
                    strokeDasharray: `${metodo.largo} ${metodo.circunferencia}`,
                    strokeDashoffset: -metodo.offset,
                  }}
                />
              ))}
              <text x="100" y="108" className="dona-num">
                {principal ? `${textoPorcentaje(principal)}` : ""}
              </text>
            </svg>
            <ul className="leyenda">
              {metodos.map((metodo) => (
                <li key={metodo.clave}>
                  <i className={`sw ${metodo.clase}`} />
                  <span className="leyenda__full">{metodo.etiqueta}</span>
                  <span className="leyenda__corto">{metodo.corto}</span>
                  <b>{textoPorcentaje(metodo)}</b>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="panel__vacio">{resumen?.cargando ? "Cargando la publicación…" : "Sin datos para graficar."}</p>
        )}
      </div>
    </article>
  );
}
