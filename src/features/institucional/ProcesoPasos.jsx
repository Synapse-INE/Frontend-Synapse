import { PASOS } from "../../data/institucional";
import { Contenedor } from "../../components/ui/Contenedor";
import { Etiqueta } from "../../components/ui/Etiqueta";

export function ProcesoPasos() {
  return (
    <section className="proceso revelar">
      <Contenedor>
        <Etiqueta>De la solicitud a la entrega</Etiqueta>
        <h2>El proceso, paso a paso</h2>
        <ol className="pasos">
          {PASOS.map((paso) => (
            <li className="revelar" key={paso.titulo}>
              <strong>{paso.titulo}</strong>
              <p>{paso.texto}</p>
            </li>
          ))}
        </ol>
      </Contenedor>
    </section>
  );
}
