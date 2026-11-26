import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Etiqueta } from "../../components/ui/Etiqueta";
import { ROLES } from "../../sesion/roles";
import { useSesion } from "../../sesion/Sesion";
import { ApiError } from "../../servicios/api";
import { aceptarInvitacion } from "../../servicios/sesionApi";
import { AccesoMarco } from "./AccesoMarco";

export function AceptarInvitacionPage() {
  const { sesion } = useSesion();
  const navigate = useNavigate();
  const [parametros] = useSearchParams();
  const token = parametros.get("token") || "";
  const [datos, setDatos] = useState({ nombre: "", clave: "", confirmar: "" });
  const [visible, setVisible] = useState(false);
  const [enviando, setEnviando] = useState(false);
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
    if (!token) {
      setErrores({ general: "El enlace no trae el token de invitación." });
      return;
    }
    const fallos = {};
    if (datos.nombre.trim().length < 2) fallos.nombre = "Escribe el nombre de la persona.";
    if (datos.clave.length < 12) fallos.clave = "La contraseña necesita al menos 12 caracteres.";
    if (datos.clave !== datos.confirmar) fallos.confirmar = "La confirmación no coincide.";
    setErrores(fallos);
    if (Object.keys(fallos).length) return;

    setEnviando(true);
    try {
      const cuenta = await aceptarInvitacion({
        token,
        nombre: datos.nombre.trim(),
        clave: datos.clave,
      });
      navigate("/ingresar", {
        replace: true,
        state: {
          aviso: `Cuenta de proveedor creada para ${cuenta.email}. Ya puede ingresar.`,
        },
      });
    } catch (fallo) {
      if (fallo instanceof ApiError) {
        const campo = fallo.errors?.[0]?.field;
        if (campo === "nombre") setErrores({ nombre: fallo.errors[0].message });
        else if (campo === "password") setErrores({ clave: fallo.errors[0].message });
        else setErrores({ general: fallo.detail || "No se pudo completar la invitación." });
      } else {
        setErrores({ general: "No se pudo completar la invitación." });
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AccesoMarco
      titulo="Invitación para proveedor del INE."
      texto="Con este enlace creas la cuenta ligada a la empresa que invitó el administrador. Luego ingresas con el correo de la invitación y la contraseña que definas aquí."
    >
      <Etiqueta>Proveedor</Etiqueta>
      <h2>Completar invitación</h2>
      {!token ? (
        <p className="acceso__error" role="alert">El enlace no trae el token de invitación. Pide al administrador que envíe otra invitación.</p>
      ) : (
        <p className="acceso__lead">Define tu nombre y una contraseña segura. El correo de acceso es el que recibió la invitación.</p>
      )}

      {token ? (
        <form className="acceso__forma" onSubmit={guardar}>
          <label>
            Nombre
            <input name="nombre" value={datos.nombre} onChange={cambiar} aria-invalid={Boolean(errores.nombre)} placeholder="Nombre de quien administra la cuenta" />
            {errores.nombre ? <span className="formulario__error" role="alert">{errores.nombre}</span> : null}
          </label>
          <label>
            Contraseña
            <span className="acceso__clave">
              <input
                name="clave"
                type={visible ? "text" : "password"}
                value={datos.clave}
                onChange={cambiar}
                aria-invalid={Boolean(errores.clave)}
                placeholder="Mínimo 12 caracteres"
              />
              <button type="button" className="acceso__ver" onClick={() => setVisible((v) => !v)}>{visible ? "Ocultar" : "Ver"}</button>
            </span>
            {errores.clave ? <span className="formulario__error" role="alert">{errores.clave}</span> : null}
          </label>
          <label>
            Confirmar contraseña
            <input name="confirmar" type={visible ? "text" : "password"} value={datos.confirmar} onChange={cambiar} aria-invalid={Boolean(errores.confirmar)} placeholder="Repita la contraseña" />
            {errores.confirmar ? <span className="formulario__error" role="alert">{errores.confirmar}</span> : null}
          </label>
          {errores.general ? <p className="acceso__error" role="alert">{errores.general}</p> : null}
          <button type="submit" className="btn btn--naranja" disabled={enviando}>{enviando ? "Creando cuenta…" : "Crear cuenta de proveedor"}</button>
        </form>
      ) : null}

      <p className="acceso__cambio">
        ¿Ya tiene cuenta? <Link to="/ingresar">Ingresar</Link>
      </p>
    </AccesoMarco>
  );
}