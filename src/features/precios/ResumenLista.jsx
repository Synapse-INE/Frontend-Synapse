import { PRECIOS } from "../../data/precios";
import { Boton } from "../../components/ui/Boton";
import { Contenedor } from "../../components/ui/Contenedor";
import { Etiqueta } from "../../components/ui/Etiqueta";
import { ComparativoPrecios } from "./ComparativoPrecios";
import { TablaPrecios } from "./TablaPrecios";

export function ResumenLista() {
  return (
    <section className="bloque revelar" id="lista">
      <Contenedor>
        <div className="bloque__cab">
          <div>
            <Etiqueta>Lista de precios</Etiqueta>
            <h2>Precios de referencia en el mercado</h2>
            <p className="bloque__intro">
              Valores estadísticos para que el Estado compre sin sobreprecios. Comparativo visual del caso práctico y
              renglones tipo de consulta.
            </p>
          </div>
          <Boton variante="naranja" to="/solicitud">
            Solicitar un renglón nuevo
          </Boton>
        </div>
        <div className="precios-vista">
          <ComparativoPrecios items={PRECIOS} />
          <TablaPrecios items={PRECIOS} />
        </div>
        <p className="nota">
          Montos ilustrativos del caso DPIR. En producción se cargan desde la publicación mensual oficial.
        </p>
      </Contenedor>
    </section>
  );
}
