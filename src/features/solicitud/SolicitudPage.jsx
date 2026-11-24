import { REQUISITOS_SOLICITUD } from "../../data/institucional";
import { Contenedor } from "../../components/ui/Contenedor";
import { Etiqueta } from "../../components/ui/Etiqueta";
import { FormularioSolicitud } from "./FormularioSolicitud";

export function SolicitudPage() {
  return (
    <section className="pagina solicitud revelar">
      <Contenedor className="solicitud__caja">
        <div>
          <Etiqueta naranja>Solicitud de precios</Etiqueta>
          <h2>Pide un precio de referencia al INE</h2>
          <p>
            La autoridad contratante debe enviar un oficio a la máxima autoridad del Instituto, cumpliendo forma y
            especificaciones del reglamento de la modalidad.
          </p>
          <ul className="checks">
            {REQUISITOS_SOLICITUD.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <FormularioSolicitud />
      </Contenedor>
    </section>
  );
}
