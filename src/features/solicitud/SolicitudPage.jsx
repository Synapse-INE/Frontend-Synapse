import { Contenedor } from "../../components/ui/Contenedor";
import { Etiqueta } from "../../components/ui/Etiqueta";
import { FormularioSolicitud } from "./FormularioSolicitud";

export function SolicitudPage() {
  return (
    <section className="pagina solicitud revelar">
      <Contenedor className="solicitud__caja">
        <FormularioSolicitud
          intro={
            <div>
              <Etiqueta naranja>Solicitud de precios</Etiqueta>
              <h2>Pide un precio de referencia al INE</h2>
              <p>
                La autoridad contratante debe enviar un oficio a la máxima autoridad del Instituto, cumpliendo forma y
                especificaciones del reglamento de la modalidad.
              </p>
            </div>
          }
        />
      </Contenedor>
    </section>
  );
}
