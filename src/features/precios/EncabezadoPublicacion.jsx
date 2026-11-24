import { Boton } from "../../components/ui/Boton";
import { Etiqueta } from "../../components/ui/Etiqueta";
import { AvisoPublicacion } from "./AvisoPublicacion";

export function EncabezadoPublicacion() {
  return (
    <header className="publicacion-encabezado">
      <Etiqueta>Publicación mensual</Etiqueta>
      <h2>Precios de referencia</h2>
      <Boton className="publicacion-encabezado__cta" variante="naranja" to="/solicitud">
        Solicitar un renglón nuevo
      </Boton>
      <AvisoPublicacion />
    </header>
  );
}
