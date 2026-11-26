import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Etiqueta } from "../../components/ui/Etiqueta";
import { ROLES } from "../../sesion/roles";
import { useSesion } from "../../sesion/Sesion";

export function AvisoCuentaSolicitud({ sesion, onCerrar }) {
  const dialogo = useRef(null);
  const sigue = useRef(false);
  const tituloId = useId();
  const rol = sesion ? ROLES[sesion.rol] : null;

  useEffect(() => {
    const nodo = dialogo.current;
    if (nodo && !nodo.open) nodo.showModal();
  }, []);

  function cerrar() {
    dialogo.current?.close();
  }

  function salir() {
    sigue.current = true;
    cerrar();
  }

  return createPortal(
    <dialog
      ref={dialogo}
      className="aviso-cuenta"
      aria-labelledby={tituloId}
      onClose={() => onCerrar(sigue.current ? "salida" : "descartar")}
      onClick={(evento) => {
        if (evento.target === dialogo.current) cerrar();
      }}
    >
      <div className="aviso-cuenta__panel">
        <button type="button" className="dialogo-cerrar" aria-label="Cerrar" onClick={cerrar}>
          <span aria-hidden="true">×</span>
        </button>
        <Etiqueta naranja>Solicitud de precios</Etiqueta>
        {rol ? (
          <>
            <h2 id={tituloId}>Esta cuenta no envía solicitudes</h2>
            <p className="aviso-cuenta__texto">
              Para pedir un precio de referencia hace falta una cuenta de solicitante aprobada. Entraste como {rol.etiqueta.toLowerCase()}.
            </p>
            <div className="aviso-cuenta__opciones">
              <Link className="aviso-cuenta__opcion" to={rol.destino} onClick={salir}>
                <span>Tu espacio</span>
                <strong>Ir a mi cuenta</strong>
                <small>Vuelve al área de {rol.etiqueta.toLowerCase()}.</small>
              </Link>
            </div>
          </>
        ) : (
          <>
            <h2 id={tituloId}>Para pedir un precio, entra con tu cuenta</h2>
            <p className="aviso-cuenta__texto">
              La solicitud la envía una entidad con cuenta de solicitante aprobada. Si ya la tienes, ingresa. Si todavía no, regístrate.
            </p>
            <div className="aviso-cuenta__opciones">
              <Link className="aviso-cuenta__opcion" to="/ingresar" onClick={salir}>
                <span>Ya tengo cuenta</span>
                <strong>Ingresar</strong>
                <small>Entra y continúa con la solicitud.</small>
              </Link>
              <Link className="aviso-cuenta__opcion" to="/registro" onClick={salir}>
                <span>Aún no tengo cuenta</span>
                <strong>Registrarse</strong>
                <small>Crea la cuenta de tu entidad. El INE la revisa antes de habilitarla.</small>
              </Link>
            </div>
          </>
        )}
      </div>
    </dialog>,
    document.body,
  );
}

export function AccionSolicitar({ className, children, onIr }) {
  const { sesion, cargando } = useSesion();
  const [abierto, setAbierto] = useState(false);
  const solicitante = !cargando && sesion?.rol === "solicitante";

  if (solicitante) {
    return (
      <Link className={className} to="/solicitud" onClick={onIr}>
        {children}
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          if (cargando) return;
          onIr?.();
          setAbierto(true);
        }}
      >
        {children}
      </button>
      {abierto ? (
        <AvisoCuentaSolicitud sesion={sesion} onCerrar={() => setAbierto(false)} />
      ) : null}
    </>
  );
}
