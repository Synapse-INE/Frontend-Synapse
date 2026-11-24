import { MODALIDADES } from "../../data/precios";
import { USOS } from "../../data/institucional";
import { Contenedor } from "../../components/ui/Contenedor";
import { Etiqueta } from "../../components/ui/Etiqueta";

export function MarcoUso() {
  return (
    <section className="modalidades revelar">
      <Contenedor>
        <Etiqueta clara>Marco de uso</Etiqueta>
        <h2>¿Para qué sirven estos precios?</h2>
        <div className="tarjetas">
          {USOS.map((uso) => (
            <article className="tarjeta revelar" key={uso.n}>
              <span className="tarjeta__n">{uso.n}</span>
              <h3>{uso.titulo}</h3>
              <p>{uso.texto}</p>
            </article>
          ))}
        </div>
        <div className="pills">
          {MODALIDADES.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </Contenedor>
    </section>
  );
}
