import { METODOS } from "../../data/institucional";
import { Contenedor } from "../../components/ui/Contenedor";
import { Etiqueta } from "../../components/ui/Etiqueta";

export function Metodologia() {
  return (
    <section className="metodo revelar">
      <Contenedor>
        <div className="metodo__intro">
          <Etiqueta>Cómo se calcula</Etiqueta>
          <h2>Tres herramientas para el precio justo</h2>
          <p>
            La DPIR no adivina un valor: aplica estadística sobre cotizaciones reales de proveedores, catálogos,
            GUATECOMPRAS e históricos del INE. Según cómo se comporten los precios —si son parecidos, si hay valores
            atípicos o si uno se repite—, se elige el indicador más representativo: promedio, mediana o moda.
          </p>
        </div>
        <div className="metodo__grid">
          {METODOS.map((metodo) => (
            <article className="met-card revelar" key={metodo.titulo}>
              <h3>{metodo.titulo}</h3>
              <p>{metodo.texto}</p>
              {metodo.tipo === "moda" ? (
                <div className="moda-freq" aria-hidden="true">
                  {metodo.frecuencias.map((n, i) => (
                    <i key={i} className={i === metodo.moda ? "moda" : undefined} style={{ "--n": n }} />
                  ))}
                </div>
              ) : (
                <div className={`mini-bars${metodo.tipo === "promedio" ? " mini-bars--eq" : ""}`} aria-hidden="true">
                  {metodo.barras.map((h, i) => (
                    <span
                      key={i}
                      className={i === metodo.centro ? "es-centro" : undefined}
                      style={{ "--h": `${h}%` }}
                    />
                  ))}
                </div>
              )}
              <small>{metodo.nota}</small>
            </article>
          ))}
        </div>
      </Contenedor>
    </section>
  );
}
