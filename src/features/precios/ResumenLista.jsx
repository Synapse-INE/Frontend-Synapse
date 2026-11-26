import { Contenedor } from "../../components/ui/Contenedor";
import { EncabezadoPublicacion } from "./EncabezadoPublicacion";
import { ResumenConsulta } from "./ResumenConsulta";
import { SelectorCategoria } from "./SelectorCategoria";
import { TablaPrecios } from "./TablaPrecios";
import { tituloCategoria } from "./tituloCategoria";

export function ResumenLista({
  items,
  indicadores,
  categorias = [],
  categoria = "",
  total = 0,
  cargando = false,
  onCategoria,
  destinoLista = "/lista",
}) {
  const nombre = tituloCategoria(categorias.find((fila) => fila.etiqueta === categoria)?.etiqueta);

  return (
    <section className="bloque revelar" id="lista">
      <Contenedor>
        <EncabezadoPublicacion destinoLista={destinoLista} />
        <ResumenConsulta indicadores={indicadores} />
        <div className="filtro-muestra">
          <label>
            <span>Categoría</span>
            <SelectorCategoria categorias={categorias} valor={categoria} onCambio={onCategoria} />
          </label>
          <p>
            {cargando
              ? "Consultando la publicación…"
              : `Mostrando ${items.length} de ${Number(total).toLocaleString("es-GT")}${nombre ? ` en ${nombre}` : ""}.`}
          </p>
        </div>
        <div className="precios-vista">
          <TablaPrecios items={items} />
        </div>
      </Contenedor>
    </section>
  );
}
