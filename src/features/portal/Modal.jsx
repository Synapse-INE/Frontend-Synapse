import { useEffect, useId, useRef } from "react";

// Ventana modal basada en <dialog>: el navegador se encarga del foco, de Escape y del fondo.
// lateral: se abre como panel a la derecha (detalle); si no, centrada (formularios).
export function Modal({ titulo, subtitulo, lateral = false, onCerrar, children }) {
  const ref = useRef(null);
  const idTitulo = useId();

  useEffect(() => {
    const dialogo = ref.current;
    if (dialogo && !dialogo.open) dialogo.showModal();
    return () => dialogo?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      className={`modal${lateral ? " modal--lateral" : ""}`}
      aria-labelledby={idTitulo}
      onClose={onCerrar}
      onClick={(e) => e.target === ref.current && ref.current.close()}
    >
      <div className="modal__cuerpo">
        <header className="modal__cab">
          <div>
            {subtitulo && <p className="modal__sub">{subtitulo}</p>}
            <h2 id={idTitulo}>{titulo}</h2>
          </div>
          <button type="button" className="modal__cerrar" aria-label="Cerrar" onClick={() => ref.current.close()}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
