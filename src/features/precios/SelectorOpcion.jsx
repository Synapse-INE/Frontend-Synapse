import { useEffect, useId, useRef, useState } from "react";

export function SelectorOpcion({ opciones, valor, onCambio }) {
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef(null);
  const listaId = useId();
  const titulo = opciones.find((opcion) => opcion.id === valor)?.etiqueta ?? "Todos";

  useEffect(() => {
    if (!abierto) return undefined;
    function cerrar(evento) {
      if (!raiz.current?.contains(evento.target)) setAbierto(false);
    }
    function tecla(evento) {
      if (evento.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", cerrar);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", cerrar);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  function elegir(id) {
    onCambio?.(id);
    setAbierto(false);
  }

  return (
    <div className={`selector-cat${abierto ? " es-abierto" : ""}`} ref={raiz}>
      <button
        type="button"
        className="selector-cat__btn"
        aria-expanded={abierto}
        aria-controls={listaId}
        onClick={() => setAbierto((previo) => !previo)}
      >
        <span>{titulo}</span>
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
      {abierto ? (
        <div className="selector-cat__panel">
          <ul className="selector-cat__lista" id={listaId} role="listbox" aria-label="Opciones de búsqueda">
            {opciones.map((opcion) => (
              <li key={opcion.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={valor === opcion.id}
                  className={valor === opcion.id ? "es-activa" : ""}
                  onClick={() => elegir(opcion.id)}
                >
                  <span>{opcion.etiqueta}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
