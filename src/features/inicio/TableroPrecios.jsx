import { Contenedor } from "../../components/ui/Contenedor";
import { GraficoCotizaciones } from "./GraficoCotizaciones";
import { GraficoFuentes } from "./GraficoFuentes";
import { GraficoPublicacion } from "./GraficoPublicacion";

export function TableroPrecios({ estadisticas }) {
  return (
    <section className="tablero" aria-label="Panorama de la consulta">
      <Contenedor className="tablero__grid">
        <GraficoCotizaciones estadisticas={estadisticas} />
        <GraficoFuentes estadisticas={estadisticas} />
        <GraficoPublicacion estadisticas={estadisticas} />
      </Contenedor>
    </section>
  );
}
