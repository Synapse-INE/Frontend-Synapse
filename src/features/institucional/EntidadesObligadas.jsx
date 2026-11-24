import { ENTIDADES } from "../../data/institucional";
import { Contenedor } from "../../components/ui/Contenedor";
import { Etiqueta } from "../../components/ui/Etiqueta";

export function EntidadesObligadas() {
  return (
    <section className="quienes revelar">
      <Contenedor>
        <Etiqueta>Entidades obligadas</Etiqueta>
        <h2>¿Quién puede solicitar estos precios?</h2>
        <p className="bloque__intro">
          Cualquier institución que use fondos públicos puede solicitar un precio de referencia, según el artículo 1
          del Decreto 57-92 (reformado por los Decretos 9-2015 y 46-2016). El trámite cubre ministerios, municipalidades,
          entidades autónomas y organizaciones que administran recursos del Estado.
        </p>
        <ul className="quienes__lista">
          {ENTIDADES.map((entidad) => (
            <li className="revelar" key={entidad.titulo}>
              <strong>{entidad.titulo}</strong>
              {entidad.texto}
            </li>
          ))}
        </ul>
      </Contenedor>
    </section>
  );
}
