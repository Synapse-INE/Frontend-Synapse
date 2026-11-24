import { Contenedor } from "../../components/ui/Contenedor";
import { ComparativoPrecios } from "./ComparativoPrecios";
import { EncabezadoPublicacion } from "./EncabezadoPublicacion";
import { TablaPrecios } from "./TablaPrecios";

export function ResumenLista({ items, comparativo }) {
  return (
    <section className="bloque revelar" id="lista">
      <Contenedor>
        <EncabezadoPublicacion />
        <div className="precios-vista">
          <ComparativoPrecios items={comparativo} />
          <TablaPrecios items={items} />
        </div>
      </Contenedor>
    </section>
  );
}
