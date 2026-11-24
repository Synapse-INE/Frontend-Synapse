import { useCallback, useEffect, useRef, useState } from "react";

// Mensaje breve de confirmación ("Cotización enviada"). Se anuncia a lectores de pantalla.
export function useAviso() {
  const [texto, setTexto] = useState("");
  const temporizador = useRef(0);
  const mostrar = useCallback((mensaje) => {
    setTexto(mensaje);
    window.clearTimeout(temporizador.current);
    temporizador.current = window.setTimeout(() => setTexto(""), 3800);
  }, []);
  useEffect(() => () => window.clearTimeout(temporizador.current), []);
  return [texto, mostrar];
}

export function Aviso({ texto }) {
  return (
    <div className="aviso-zona" role="status" aria-live="polite">
      {texto && (
        <p className="aviso" key={texto}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          {texto}
        </p>
      )}
    </div>
  );
}
