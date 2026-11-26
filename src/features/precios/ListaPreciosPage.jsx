import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Contenedor } from "../../components/ui/Contenedor";
import { useCategoriasPublicacion } from "../../hooks/useCatalogoPublico";
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
  const pagina = Math.max(1, Number(params.get("p")) || 1);
  const publicacion = usePublicacion(consulta, pagina);
  const { categorias } = useCategoriasPublicacion();

  function buscar(siguiente) {
    setParams(consultaAParams(siguiente));
  }

  function irPagina(siguiente) {
    const nuevos = consultaAParams(consulta);
    if (siguiente > 1) nuevos.set("p", String(siguiente));
    setParams(nuevos);
  }

  return (
    <section className="pagina bloque revelar">
      <Contenedor>
        <EncabezadoPublicacion mostrarLista={false} />
        <BuscadorPublicacion inicial={consulta} onBuscar={buscar} categorias={categorias} />
        {publicacion.error ? (
          <p className="nota" role="alert">
            {publicacion.error}
          </p>
        ) : null}
        <ResumenConsulta indicadores={publicacion.indicadores} />
        <div className="precios-vista">
          <TablaPrecios items={publicacion.items} />
        </div>
        <div className="paginacion">
          <button type="button" className="btn btn--linea" disabled={pagina <= 1 || publicacion.cargando} onClick={() => irPagina(pagina - 1)}>
            Anterior
          </button>
          <span>
            {publicacion.cargando ? "Consultando…" : `Página ${publicacion.pagina} de ${publicacion.paginas}`}
          </span>
          <button
            type="button"
            className="btn btn--linea"
            disabled={publicacion.cargando || pagina >= publicacion.paginas}
            onClick={() => irPagina(pagina + 1)}
          >
            Siguiente
          </button>
        </div>
      </Contenedor>
    </section>
  );
}
