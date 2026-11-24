import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { filtrarPrecios, PRECIOS } from "../../data/precios";
import { Boton } from "../../components/ui/Boton";
import { Contenedor } from "../../components/ui/Contenedor";
import { Etiqueta } from "../../components/ui/Etiqueta";
import { ComparativoPrecios } from "./ComparativoPrecios";
import { TablaPrecios } from "./TablaPrecios";

export function ListaPreciosPage() {
  const [params, setParams] = useSearchParams();
  const inicial = params.get("q") ?? "";
  const [consulta, setConsulta] = useState(inicial);

  const filtrados = useMemo(() => filtrarPrecios(PRECIOS, consulta), [consulta]);

  function buscar(evento) {
    evento.preventDefault();
    const q = consulta.trim();
    setParams(q ? { q } : {});
  }

  return (
    <section className="pagina bloque revelar">
      <Contenedor>
        <div className="bloque__cab">
          <div>
            <Etiqueta>Lista de precios</Etiqueta>
            <h2>Precios de referencia en el mercado</h2>
            <p className="bloque__intro">
              Consulta renglones publicados por la DPIR. Usa el buscador para filtrar por bien, especificación o método
              de cálculo.
            </p>
          </div>
          <Boton variante="naranja" to="/solicitud">
            Solicitar un renglón nuevo
          </Boton>
        </div>

        <form className="buscador" role="search" onSubmit={buscar} style={{ marginBottom: 20, maxWidth: 640 }}>
          <label className="sr-only" htmlFor="lista-q">
            Filtrar lista
          </label>
          <input
            id="lista-q"
            type="search"
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            placeholder="Filtrar por bien o servicio…"
          />
          <Boton type="submit" variante="azul">
            Filtrar
          </Boton>
        </form>

        <div className="precios-vista">
          <ComparativoPrecios items={filtrados} />
          <TablaPrecios items={filtrados} />
        </div>
        <p className="nota">
          Montos ilustrativos del caso DPIR. En producción se cargan desde la publicación mensual oficial.
        </p>
      </Contenedor>
    </section>
  );
}
