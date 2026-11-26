import { useState } from "react";
import { OPCIONES_BUSQUEDA, LIMITES_BUSQUEDA } from "../../data/categorias";
import { sanitizarConsulta } from "../../servicios/catalogo";
import { Boton } from "../../components/ui/Boton";
import { SelectorCategoria } from "./SelectorCategoria";
import { SelectorOpcion } from "./SelectorOpcion";

const ETIQUETAS = {
  todos: "Término",
  producto: "Producto",
  categoria: "Categoría",
  nog: "NOG",
  fecha: "Fecha",
};

export function BuscadorPublicacion({ inicial, onBuscar, compacto = false, categorias = [] }) {
  const partida = sanitizarConsulta(inicial);
  const [opcion, setOpcion] = useState(partida.opcion);
  const [valor, setValor] = useState(partida.valor);
  const [aviso, setAviso] = useState("");

  function enviar(evento) {
    evento.preventDefault();
    const consulta = sanitizarConsulta({ opcion, valor });
    if (consulta.valor && opcion !== "categoria" && opcion !== "fecha" && consulta.valor.length < 2) {
      setAviso("Escribe al menos 2 caracteres.");
      return;
    }
    setAviso("");
    onBuscar(consulta);
  }

  const limite = LIMITES_BUSQUEDA[opcion] ?? 120;

  return (
    <form className={`consulta-catalogo${compacto ? " consulta-catalogo--compacto" : ""}`} onSubmit={enviar}>
      <label className="consulta-catalogo__campo">
        <span>Opciones de búsqueda</span>
        <SelectorOpcion
          opciones={OPCIONES_BUSQUEDA}
          valor={opcion}
          onCambio={(siguiente) => {
            setOpcion(siguiente);
            setValor("");
          }}
        />
      </label>

      <label className="consulta-catalogo__campo consulta-catalogo__campo--valor">
        <span>{ETIQUETAS[opcion]}</span>
        {opcion === "categoria" ? (
          <SelectorCategoria categorias={categorias} valor={valor} onCambio={setValor} />
        ) : opcion === "fecha" ? (
          <input
            name="v"
            type="date"
            value={valor}
            max="2100-12-31"
            min="2000-01-01"
            onChange={(e) => setValor(e.target.value)}
          />
        ) : (
          <input
            name="v"
            type={opcion === "nog" ? "text" : "search"}
            inputMode={opcion === "nog" ? "numeric" : "search"}
            autoComplete="off"
            spellCheck="false"
            maxLength={limite}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder={
              opcion === "nog" ? "Número de operación GUATECOMPRAS" : "Escribe para consultar…"
            }
          />
        )}
      </label>

      <Boton type="submit" variante="azul">
        Consultar
      </Boton>
      {aviso ? <p className="consulta-catalogo__aviso" role="alert">{aviso}</p> : null}
    </form>
  );
}
