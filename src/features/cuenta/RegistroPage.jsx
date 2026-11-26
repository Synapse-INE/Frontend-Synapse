import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { Etiqueta } from "../../components/ui/Etiqueta";
import { ROLES } from "../../sesion/roles";
import { useSesion } from "../../sesion/Sesion";
import { ApiError } from "../../servicios/api";
import { registrarSolicitante } from "../../servicios/sesionApi";
import { AccesoMarco } from "./AccesoMarco";

export function RegistroPage() {
  const { sesion } = useSesion();
  const navigate = useNavigate();
  const [datos, setDatos] = useState({ nombre: "", correo: "", institucion: "", nit: "", cargo: "", clave: "", confirmar: "" });
  const [visible, setVisible] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [errores, setErrores] = useState({});

  useEffect(() => {
    if (sesion) navigate(ROLES[sesion.rol]?.destino || "/cuenta", { replace: true });
  }, [sesion, navigate]);

  function cambiar(evento) {
    const { name, value } = evento.target;
    setDatos((prev) => ({ ...prev, [name]: value }));
    setErrores((prev) => ({ ...prev, [name]: "" }));
  }

  async function guardar(evento) {
    evento.preventDefault();
    const fallos = {};
    if (datos.nombre.trim().length < 3) fallos.nombre = "Escribe el nombre de la persona.";
    if (datos.institucion.trim().length < 3) fallos.institucion = "Escribe el nombre oficial de la institución.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo.trim())) fallos.correo = "Escribe un correo válido.";
    if (datos.clave.length < 12) fallos.clave = "La contraseña necesita al menos 12 caracteres.";
    if (datos.clave !== datos.confirmar) fallos.confirmar = "La confirmación no coincide con la contraseña.";
    setErrores(fallos);
    if (Object.keys(fallos).length) return;
    setEnviando(true);
    try {
      await registrarSolicitante(datos);
      setConfirmado(true);
    } catch (fallo) {
      const campo = fallo instanceof ApiError ? fallo.errors?.[0]?.field : "";
      if (campo && campo in datos) {
        setErrores({ [campo === "email" ? "correo" : campo]: fallo.errors[0].message });
      } else {
        setErrores({ general: fallo instanceof ApiError ? fallo.detail : "No se pudo registrar la cuenta." });
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AccesoMarco
      titulo="El registro es para quien pide un precio de referencia."
      texto="Se dejan la persona, la institución y el cargo. La cuenta queda en revisión y las solicitudes se habilitan cuando el INE la aprueba."
    >
      <p className="etiqueta">Acceso</p>
      <h2>Registrarse</h2>
      <p className="acceso__lead">Se completan los datos de la persona y de su institución.</p>

      <form className="acceso__forma" onSubmit={guardar}>
        <label>
          Nombre
          <input name="nombre" value={datos.nombre} onChange={cambiar} aria-invalid={Boolean(errores.nombre)} placeholder="Nombre de la persona" />
          {errores.nombre ? <span className="formulario__error" role="alert">{errores.nombre}</span> : null}
        </label>
        <label>
          Institución
          <input name="institucion" value={datos.institucion} onChange={cambiar} aria-invalid={Boolean(errores.institucion)} placeholder="Nombre oficial de la institución" />
          {errores.institucion ? <span className="formulario__error" role="alert">{errores.institucion}</span> : null}
        </label>
        <label>
          Cargo
          <input name="cargo" value={datos.cargo} onChange={cambiar} placeholder="Cargo en la institución, si aplica" />
        </label>
        <label>
          NIT
          <input name="nit" value={datos.nit} onChange={cambiar} placeholder="NIT de la institución, si aplica" />
        </label>
        <label>
          Correo
          <input name="correo" type="email" autoComplete="email" value={datos.correo} onChange={cambiar} aria-invalid={Boolean(errores.correo)} placeholder="nombre@institucion.gob.gt" />
          {errores.correo ? <span className="formulario__error" role="alert">{errores.correo}</span> : null}
        </label>
        <label>
          Contraseña
          <span className="acceso__clave">
            <input name="clave" type={visible ? "text" : "password"} autoComplete="new-password" value={datos.clave} onChange={cambiar} aria-invalid={Boolean(errores.clave)} placeholder="Mínimo 12 caracteres" />
            <button type="button" onClick={() => setVisible((valor) => !valor)}>{visible ? "Ocultar" : "Ver"}</button>
          </span>
          {errores.clave ? <span className="formulario__error" role="alert">{errores.clave}</span> : null}
        </label>
        <label>
          Confirmar contraseña
          <input name="confirmar" type={visible ? "text" : "password"} autoComplete="new-password" value={datos.confirmar} onChange={cambiar} aria-invalid={Boolean(errores.confirmar)} placeholder="Repite la contraseña" />
          {errores.confirmar ? <span className="formulario__error" role="alert">{errores.confirmar}</span> : null}
        </label>
        {errores.general ? <p className="acceso__error" role="alert">{errores.general}</p> : null}
        <button type="submit" className="btn btn--naranja btn--bloque" disabled={enviando}>
          {enviando ? "Enviando…" : "Crear cuenta"}
        </button>
      </form>

      <p className="acceso__cambio">
        ¿Ya hay cuenta? <Link to="/ingresar">Ingresar</Link>
      </p>
      {confirmado ? (
        <DialogoVerificacion
          correo={datos.correo.trim()}
          onCerrar={() => navigate("/ingresar", { replace: true })}
        />
      ) : null}
    </AccesoMarco>
  );
}

function DialogoVerificacion({ correo, onCerrar }) {
  const dialogo = useRef(null);
  const tituloId = useId();

  useEffect(() => {
    const nodo = dialogo.current;
    if (nodo && !nodo.open) nodo.showModal();
  }, []);

  function cerrar() {
    dialogo.current?.close();
  }

  return createPortal(
    <dialog
      ref={dialogo}
      className="aviso-cuenta"
      aria-labelledby={tituloId}
      onClose={onCerrar}
      onClick={(evento) => {
        if (evento.target === dialogo.current) cerrar();
      }}
    >
      <div className="aviso-cuenta__panel">
        <button type="button" className="dialogo-cerrar" aria-label="Cerrar" onClick={cerrar}>
          <span aria-hidden="true">×</span>
        </button>
        <Etiqueta naranja>Registro</Etiqueta>
        <h2 id={tituloId}>Revisa tu correo</h2>
        <p className="aviso-cuenta__texto">
          Enviamos un enlace a {correo}. Ábrelo para verificar la cuenta. El ingreso se habilita cuando el INE la aprueba.
        </p>
        <button type="button" className="btn btn--naranja btn--bloque" onClick={cerrar}>
          Ir a ingresar
        </button>
      </div>
    </dialog>,
    document.body,
  );
}
