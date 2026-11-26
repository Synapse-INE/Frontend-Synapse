import { Boton } from "../../components/ui/Boton";
import { Etiqueta } from "../../components/ui/Etiqueta";
import { AccionSolicitar } from "../solicitud/AvisoCuentaSolicitud";
import { AvisoPublicacion } from "./AvisoPublicacion";

export function EncabezadoPublicacion({ mostrarLista = true, destinoLista = "/lista" }) {
  return (
    <header className="publicacion-encabezado">
      <Etiqueta>Publicación mensual</Etiqueta>
      <h2>Precios de referencia</h2>
      <div className="publicacion-encabezado__cta">
        {mostrarLista ? (
          <Boton variante="linea" to={destinoLista}>
            Ver lista de precios
          </Boton>
        ) : null}
        <AccionSolicitar className="btn btn--naranja">
          Solicitar un renglón nuevo
        </AccionSolicitar>
      </div>
      <AvisoPublicacion />
    </header>
  );
}
