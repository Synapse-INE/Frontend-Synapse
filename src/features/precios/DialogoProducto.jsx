import { useEffect, useRef } from "react";
import { CATEGORIA_POR_ID } from "../../data/categorias";
import { estaVigente, fechaRegistrada, formatearFecha, formatearQuetzales, textoOpcional } from "../../data/precios";
import { Boton } from "../../components/ui/Boton";

export function DialogoProducto({ item, onCerrar }) {
  const dialogo = useRef(null);

  useEffect(() => {
    const nodo = dialogo.current;
    if (!nodo) return;
    if (item && !nodo.open) nodo.showModal();
    if (!item && nodo.open) nodo.close();
  }, [item]);

  function clicFondo(evento) {
    if (evento.target === dialogo.current) onCerrar();
  }

  const categoria = item
    ? CATEGORIA_POR_ID[item.categoriaId]?.nombre ?? textoOpcional(item.categoria)
    : "";
  const vigencia = item
    ? fechaRegistrada(item.vigenciaHasta)
      ? estaVigente(item.vigenciaHasta)
        ? "Vigente"
        : "Vencida"
      : "No registrada"
    : "";
  const chipVigencia =
    vigencia === "Vigente" ? "chip--ok" : vigencia === "Vencida" ? "chip--aviso" : "chip--neutro";

  return (
    <dialog
      ref={dialogo}
      className="dialogo-producto"
      aria-labelledby="dialogo-producto-titulo"
      onClose={onCerrar}
      onClick={clicFondo}
    >
      {item ? (
        <div className="dialogo-producto__panel">
          <button type="button" className="dialogo-cerrar" onClick={onCerrar} aria-label="Cerrar">
            <span aria-hidden="true">×</span>
          </button>

          <header className="dialogo-producto__cab">
            <p className="etiqueta">Correlativo {item.correlativo ?? "—"}</p>
            <h3 id="dialogo-producto-titulo">{item.producto}</h3>
            <div className="dialogo-producto__meta">
              <p className="dialogo-producto__precio">{formatearQuetzales(item.precio)}</p>
              <span className={`chip ${chipVigencia}`}>{vigencia}</span>
            </div>
          </header>

          <div className="dialogo-producto__cuerpo">
            <section className="dialogo-bloque">
              <h4>Producto</h4>
              <p className="dialogo-bloque__texto">{item.caracteristicas || "—"}</p>
              <dl className="dialogo-filas">
                <Fila etiqueta="Presentación" valor={textoOpcional(item.presentacion)} />
                <Fila etiqueta="Categoría" valor={categoria} />
              </dl>
            </section>

            <section className="dialogo-bloque">
              <h4>Compra pública</h4>
              <dl className="dialogo-filas">
                <Fila etiqueta="Modalidad" valor={textoOpcional(item.modalidad)} />
                <Fila etiqueta="NOG" valor={textoOpcional(item.nog)} />
                <Fila etiqueta="Evento" valor={textoOpcional(item.evento)} ancho />
              </dl>
            </section>

            <section className="dialogo-bloque">
              <h4>Publicación</h4>
              <dl className="dialogo-filas">
                <Fila etiqueta="Fecha de publicación" valor={formatearFecha(item.fechaPublicacion)} />
                <Fila
                  etiqueta="Vigencia hasta"
                  valor={fechaRegistrada(item.vigenciaHasta) ? formatearFecha(item.vigenciaHasta) : "No registrada"}
                />
              </dl>
            </section>
          </div>

          <footer className="dialogo-producto__pie">
            <Boton type="button" variante="azul" className="btn--chico" onClick={onCerrar}>
              Cerrar
            </Boton>
          </footer>
        </div>
      ) : null}
    </dialog>
  );
}

function Fila({ etiqueta, valor, ancho = false }) {
  return (
    <div className={`dialogo-fila${ancho ? " dialogo-fila--ancho" : ""}`}>
      <dt>{etiqueta}</dt>
      <dd>{valor}</dd>
    </div>
  );
}
