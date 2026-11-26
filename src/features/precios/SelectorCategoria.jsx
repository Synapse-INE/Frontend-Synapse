import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { compararCategoria, tituloCategoria } from "./tituloCategoria";

function contenedorAnclaje(nodo) {
  return nodo?.closest("dialog.dialogo-producto, .dialogo-producto, dialog") ?? null;
}

export function SelectorCategoria({
  categorias = [],
  valor = "",
  onCambio,
  permitirTodas = true,
  etiquetaVacia,
  invalido = false,
}) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const raiz = useRef(null);
  const boton = useRef(null);
  const panel = useRef(null);
  const campo = useRef(null);
  const listaId = useId();
  const [anclaje, setAnclaje] = useState(null);
  const [coords, setCoords] = useState(null);

  const vacio = etiquetaVacia ?? (permitirTodas ? "Todas las categorías" : "Elegir categoría");
  const seleccion = categorias.find((fila) => fila.etiqueta === valor);
  const titulo = seleccion
    ? tituloCategoria(seleccion.etiqueta)
    : valor
      ? tituloCategoria(valor)
      : vacio;

  const visibles = useMemo(() => {
    const filtro = compararCategoria(busqueda);
    const ordenadas = [...categorias].sort((a, b) =>
      compararCategoria(a.etiqueta).localeCompare(compararCategoria(b.etiqueta), "es"),
    );
    if (!filtro) return ordenadas;
    return ordenadas.filter((fila) => compararCategoria(fila.etiqueta).includes(filtro));
  }, [categorias, busqueda]);

  useLayoutEffect(() => {
    setAnclaje(contenedorAnclaje(raiz.current));
  }, []);

  const actualizarCoords = useCallback(() => {
    const disparador = boton.current;
    if (!disparador) return;
    const margen = 12;
    const rect = disparador.getBoundingClientRect();
    const espacioAbajo = window.innerHeight - rect.bottom - margen;
    const espacioArriba = rect.top - margen;
    const preferido = Math.min(360, espacioAbajo);
    const subir = preferido < 160 && espacioArriba > espacioAbajo;
    const alto = Math.max(140, Math.min(360, subir ? espacioArriba : espacioAbajo));
    setCoords({
      top: subir ? rect.top - 8 - alto : rect.bottom + 8,
      left: rect.left,
      width: rect.width,
      maxHeight: alto,
    });
  }, []);

  const flotante = Boolean(anclaje);

  useLayoutEffect(() => {
    if (!abierto || !flotante) {
      setCoords(null);
      return undefined;
    }
    actualizarCoords();
    window.addEventListener("resize", actualizarCoords);
    document.addEventListener("scroll", actualizarCoords, true);
    return () => {
      window.removeEventListener("resize", actualizarCoords);
      document.removeEventListener("scroll", actualizarCoords, true);
    };
  }, [abierto, flotante, actualizarCoords]);

  useEffect(() => {
    if (!abierto) return undefined;
    function cerrar(evento) {
      const destino = evento.target;
      if (raiz.current?.contains(destino) || panel.current?.contains(destino)) return;
      setAbierto(false);
    }
    function tecla(evento) {
      if (evento.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", cerrar);
    document.addEventListener("keydown", tecla);
    campo.current?.focus();
    return () => {
      document.removeEventListener("mousedown", cerrar);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  function elegir(etiqueta) {
    onCambio?.(etiqueta);
    setBusqueda("");
    setAbierto(false);
  }

  const cuerpoPanel = (
    <>
      <div className="selector-cat__busca">
        <input
          ref={campo}
          type="search"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
          placeholder="Buscar categoría…"
          aria-label="Buscar categoría"
        />
      </div>
      <ul className="selector-cat__lista" id={listaId} role="listbox" aria-label="Categorías">
        {permitirTodas ? (
          <li>
            <button
              type="button"
              role="option"
              aria-selected={valor === ""}
              className={valor === "" ? "es-activa" : ""}
              onClick={() => elegir("")}
            >
              <span>Todas las categorías</span>
            </button>
          </li>
        ) : null}
        {visibles.map((fila) => (
          <li key={fila.etiqueta}>
            <button
              type="button"
              role="option"
              aria-selected={valor === fila.etiqueta}
              className={valor === fila.etiqueta ? "es-activa" : ""}
              onClick={() => elegir(fila.etiqueta)}
            >
              <span>{tituloCategoria(fila.etiqueta)}</span>
              <b>{Number(fila.n).toLocaleString("es-GT")}</b>
            </button>
          </li>
        ))}
        {visibles.length === 0 ? <li className="selector-cat__vacio">Ninguna categoría coincide.</li> : null}
      </ul>
    </>
  );

  const panelAbierto = abierto ? (
    <div
      ref={panel}
      className={`selector-cat__panel${flotante ? " selector-cat__panel--flotante" : ""}`}
      style={
        flotante && coords
          ? {
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width: coords.width,
              right: "auto",
              maxHeight: coords.maxHeight,
            }
          : undefined
      }
    >
      {cuerpoPanel}
    </div>
  ) : null;

  return (
    <div className={`selector-cat${abierto ? " es-abierto" : ""}`} ref={raiz}>
      <button
        ref={boton}
        type="button"
        className="selector-cat__btn"
        aria-expanded={abierto}
        aria-controls={listaId}
        aria-invalid={invalido}
        onClick={() => setAbierto((previo) => !previo)}
      >
        <span>{titulo}</span>
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
      {flotante && panelAbierto && anclaje ? createPortal(panelAbierto, anclaje) : panelAbierto}
    </div>
  );
}