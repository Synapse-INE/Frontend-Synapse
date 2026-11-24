import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CLAVE_EJEMPLO, CUENTAS, ROLES, buscarCuenta } from "../../sesion/roles";
import { useSesion } from "../../sesion/Sesion";
import { AccesoMarco } from "./AccesoMarco";

export function IngresoPage() {
  const { sesion, entrar } = useSesion();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [visible, setVisible] = useState(false);
  const [recuperar, setRecuperar] = useState(false);
  const [aviso, setAviso] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (sesion) navigate(ROLES[sesion.rol]?.destino || "/cuenta", { replace: true });
  }, [sesion, navigate]);

  function ingresar(evento) {
    evento.preventDefault();
    setError("");
    const cuenta = buscarCuenta(correo, clave);
    if (!cuenta) {
      setError("El correo o la contraseña no coinciden con una cuenta del portal.");
      return;
    }
    entrar(cuenta);
    navigate(ROLES[cuenta.rol].destino);
  }

  function enviarRecuperacion(evento) {
    evento.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
      setError("Escribe el correo de la cuenta para enviar el enlace.");
      return;
    }
    setAviso("Cuando el correo del portal esté conectado, el enlace de recuperación llega a esa dirección.");
  }

  return (
    <AccesoMarco
      titulo="El acceso abre tu espacio en el portal."
      texto="Con la cuenta se consulta el precio de referencia y se da seguimiento a lo que corresponde."
    >
      <p className="etiqueta">Acceso</p>
      <h2>{recuperar ? "Recuperar contraseña" : "Ingresar"}</h2>
      <p className="acceso__lead">
        {recuperar
          ? "Se indica el correo de la cuenta. El enlace sirve una sola vez."
          : "Se escribe el correo y la contraseña de la cuenta."}
      </p>

      <form className="acceso__forma" onSubmit={recuperar ? enviarRecuperacion : ingresar}>
        <label>
          Correo
          <input
            name="correo"
            type="email"
            autoComplete="username"
            value={correo}
            onChange={(evento) => setCorreo(evento.target.value)}
            placeholder="nombre@institucion.gob.gt"
          />
        </label>
        {recuperar ? null : (
          <label>
            Contraseña
            <span className="acceso__clave">
              <input
                name="clave"
                type={visible ? "text" : "password"}
                autoComplete="current-password"
                value={clave}
                onChange={(evento) => setClave(evento.target.value)}
                placeholder="Contraseña"
              />
              <button type="button" onClick={() => setVisible((valor) => !valor)}>
                {visible ? "Ocultar" : "Ver"}
              </button>
            </span>
          </label>
        )}
        {error ? <p className="acceso__error" role="alert">{error}</p> : null}
        {aviso ? <p className="acceso__ok" role="status">{aviso}</p> : null}
        <button type="submit" className="btn btn--naranja btn--bloque">{recuperar ? "Enviar enlace" : "Ingresar"}</button>
      </form>

      <button type="button" className="acceso__enlace" onClick={() => { setRecuperar((valor) => !valor); setError(""); setAviso(""); }}>
        {recuperar ? "Volver al ingreso" : "¿Se olvidó la contraseña?"}
      </button>
      <p className="acceso__cambio">
        ¿Aún no hay cuenta? <Link to="/registro">Registrarse</Link>
      </p>
      <p className="acceso__nota">
        Cuentas de ejemplo: {CUENTAS.map((item) => item.correo).join(", ")}. Contraseña temporal: {CLAVE_EJEMPLO}.
      </p>
    </AccesoMarco>
  );
}
