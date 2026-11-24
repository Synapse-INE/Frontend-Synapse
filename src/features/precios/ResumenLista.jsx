import { Contenedor } from "../../components/ui/Contenedor";
import { EncabezadoPublicacion } from "./EncabezadoPublicacion";
import { ResumenConsulta } from "./ResumenConsulta";
import { TablaPrecios } from "./TablaPrecios";

export function ResumenLista({ items, indicadores }) {
  return (
    <section className="bloque revelar" id="lista">
      <Contenedor>
        <EncabezadoPublicacion />
        <ResumenConsulta indicadores={indicadores} />
        <div className="precios-vista">
          <TablaPrecios items={items} />
        </div>
      </Contenedor>
    </section>
  );
}
