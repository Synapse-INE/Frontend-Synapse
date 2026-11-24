import { Contenedor } from "../../components/ui/Contenedor";
import { GraficoCotizaciones } from "./GraficoCotizaciones";
import { GraficoFuentes } from "./GraficoFuentes";
import { GraficoPublicacion } from "./GraficoPublicacion";

export function TableroPrecios() {
  return (
    <section className="tablero" aria-label="Panorama de precios">
      <Contenedor className="tablero__grid">
        <GraficoCotizaciones />
        <GraficoFuentes />
        <GraficoPublicacion />
      </Contenedor>
    </section>
  );
}
