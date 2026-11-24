import { useNavigate } from "react-router-dom";
import { Contenedor } from "../../components/ui/Contenedor";
import { Etiqueta } from "../../components/ui/Etiqueta";
import { BuscadorPublicacion } from "../precios/BuscadorPublicacion";
import { consultaAParams } from "../../servicios/catalogo";

export function ConsultaRapida() {
  const navigate = useNavigate();

  function buscar(consulta) {
    const params = consultaAParams(consulta);
    const query = params.toString();
    navigate(query ? `/lista?${query}` : "/lista");
  }

  return (
    <section className="buscar revelar" aria-labelledby="titulo-buscar">
      <Contenedor className="buscar__caja buscar__caja--catalogo">
        <div className="buscar__texto">
          <Etiqueta>Consulta rápida</Etiqueta>
          <h2 id="titulo-buscar">¿Qué precio necesitas verificar?</h2>
          <p>
            Publicación mensual de la DPIR. Puedes buscar por producto, categoría, NOG o fecha, como en el portal de
            precios de referencia.
          </p>
        </div>
        <BuscadorPublicacion compacto inicial={{ opcion: "todos", valor: "" }} onBuscar={buscar} />
      </Contenedor>
    </section>
  );
}
