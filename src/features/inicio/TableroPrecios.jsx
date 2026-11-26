import { Contenedor } from "../../components/ui/Contenedor";
import { GraficoCotizaciones } from "./GraficoCotizaciones";
import { GraficoFuentes } from "./GraficoFuentes";
import { GraficoPublicacion } from "./GraficoPublicacion";

export function TableroPrecios({ resumen }) {
  return (
    <section className="tablero" aria-label="Panorama de la publicación">
      <Contenedor className="tablero__grid">
        <GraficoCotizaciones resumen={resumen} />
        <GraficoFuentes resumen={resumen} />
        <GraficoPublicacion resumen={resumen} />
      </Contenedor>
    </section>
  );
}
