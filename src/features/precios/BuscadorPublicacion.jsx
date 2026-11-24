import { useState } from "react";
import { CATEGORIAS, OPCIONES_BUSQUEDA, LIMITES_BUSQUEDA } from "../../data/categorias";
import { sanitizarConsulta } from "../../servicios/catalogo";
import { Boton } from "../../components/ui/Boton";

const ETIQUETAS = {
  todos: "Término",
  producto: "Producto",
  categoria: "Categoría",
  nog: "NOG",
  fecha: "Fecha",
};

export function BuscadorPublicacion({ inicial, onBuscar, compacto = false }) {
  const partida = sanitizarConsulta(inicial);
  const [opcion, setOpcion] = useState(partida.opcion);
  const [valor, setValor] = useState(partida.valor);

  function enviar(evento) {
    evento.preventDefault();
    onBuscar(sanitizarConsulta({ opcion, valor }));
  }

  const limite = LIMITES_BUSQUEDA[opcion] ?? 120;

  return (
    <form className={`consulta-catalogo${compacto ? " consulta-catalogo--compacto" : ""}`} onSubmit={enviar}>
      <label className="consulta-catalogo__campo">
        <span>Opciones de búsqueda</span>
        <select
          name="op"
          value={opcion}
          onChange={(e) => {
            setOpcion(e.target.value);
            setValor("");
          }}
        >
          {OPCIONES_BUSQUEDA.map((item) => (
            <option key={item.id} value={item.id}>
              {item.etiqueta}
            </option>
          ))}
        </select>
      </label>

      <label className="consulta-catalogo__campo consulta-catalogo__campo--valor">
        <span>{ETIQUETAS[opcion]}</span>
        {opcion === "categoria" ? (
          <select name="v" value={valor} onChange={(e) => setValor(e.target.value)}>
            <option value="">Todas las categorías</option>
            {CATEGORIAS.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>
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
    </form>
  );
}
