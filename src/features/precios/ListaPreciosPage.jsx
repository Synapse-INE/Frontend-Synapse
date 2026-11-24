import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Contenedor } from "../../components/ui/Contenedor";
import { usePublicacion } from "../../hooks/usePublicacion";
import { consultaAParams, consultaDesdeUrl } from "../../servicios/catalogo";
import { BuscadorPublicacion } from "./BuscadorPublicacion";
import { EncabezadoPublicacion } from "./EncabezadoPublicacion";
import { ResumenConsulta } from "./ResumenConsulta";
import { TablaPrecios } from "./TablaPrecios";

export function ListaPreciosPage() {
  const [params, setParams] = useSearchParams();
  const clave = params.toString();
  const consulta = useMemo(() => consultaDesdeUrl(new URLSearchParams(clave)), [clave]);
  const publicacion = usePublicacion(consulta);

  function buscar(siguiente) {
    setParams(consultaAParams(siguiente));
  }

  return (
    <section className="pagina bloque revelar">
      <Contenedor>
        <EncabezadoPublicacion />
        <BuscadorPublicacion inicial={consulta} onBuscar={buscar} />
        {publicacion.error ? (
          <p className="nota" role="alert">
            {publicacion.error}
          </p>
        ) : null}
        <ResumenConsulta indicadores={publicacion.estadisticas.indicadores} />
        <div className="precios-vista">
          <TablaPrecios items={publicacion.items} />
        </div>
      </Contenedor>
    </section>
  );
}
