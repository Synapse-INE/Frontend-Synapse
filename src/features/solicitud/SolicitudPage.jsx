import { REQUISITOS_SOLICITUD } from "../../data/institucional";
import { Contenedor } from "../../components/ui/Contenedor";
import { Etiqueta } from "../../components/ui/Etiqueta";
import { useSesion } from "../../sesion/Sesion";
import { FormularioSolicitud } from "./FormularioSolicitud";

export function SolicitudPage() {
  const { sesion } = useSesion();
  const puedeEnviar = sesion?.rol === "solicitante" && sesion.estadoRevision === "aprobado";

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
        {puedeEnviar ? (
          <FormularioSolicitud institucionInicial={sesion.institucion} creadaPorId={sesion.id} />
        ) : (
          <div className="formulario formulario__confirmacion">
            <h3>La cuenta sigue en revisión</h3>
            <p>Cuando el INE apruebe el perfil de la institución, aquí se envían las solicitudes.</p>
          </div>
        )}
      </Contenedor>
    </section>
  );
}
