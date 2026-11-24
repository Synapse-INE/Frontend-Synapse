import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ROLES, cuentasDisponibles, guardarCuenta } from "../../sesion/roles";
import { useSesion } from "../../sesion/Sesion";
import { AccesoMarco } from "./AccesoMarco";

export function RegistroPage() {
  const { sesion, entrar } = useSesion();
  const navigate = useNavigate();
  const [datos, setDatos] = useState({ nombre: "", correo: "", clave: "", confirmar: "" });
  const [visible, setVisible] = useState(false);
  const [errores, setErrores] = useState({});

  useEffect(() => {
    if (sesion) navigate(ROLES[sesion.rol]?.destino || "/cuenta", { replace: true });
  }, [sesion, navigate]);

  function cambiar(evento) {
    const { name, value } = evento.target;
    setDatos((prev) => ({ ...prev, [name]: value }));
    setErrores((prev) => ({ ...prev, [name]: "" }));
  }

  function guardar(evento) {
    evento.preventDefault();
    const fallos = {};
    if (datos.nombre.trim().length < 3) fallos.nombre = "Escribe el nombre de la persona o de la entidad.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo.trim())) fallos.correo = "Escribe un correo válido.";
    if (cuentasDisponibles().some((item) => item.correo.toLowerCase() === datos.correo.trim().toLowerCase())) {
      fallos.correo = "Ese correo ya tiene una cuenta. Se ingresa con él.";
    }
    if (datos.clave.length < 8) fallos.clave = "La contraseña necesita al menos 8 caracteres.";
    if (datos.clave !== datos.confirmar) fallos.confirmar = "La confirmación no coincide con la contraseña.";
    setErrores(fallos);
    if (Object.keys(fallos).length) return;
    const cuenta = {
      nombre: datos.nombre.trim(),
      correo: datos.correo.trim(),
      rol: "externo",
      clave: datos.clave,
    };
    guardarCuenta(cuenta);
    entrar(cuenta);
    navigate(ROLES[cuenta.rol].destino);
  }

  return (
    <AccesoMarco
      titulo="El registro es para quien usa el portal desde fuera."
      texto="Se dejan el nombre, el correo y la contraseña. La cuenta queda registrada y el acceso se habilita desde la gestión del portal."
    >
      <p className="etiqueta">Acceso</p>
      <h2>Registrarse</h2>
      <p className="acceso__lead">Se completan los datos de la persona o de la entidad.</p>

      <form className="acceso__forma" onSubmit={guardar}>
        <label>
          Nombre
          <input name="nombre" value={datos.nombre} onChange={cambiar} aria-invalid={Boolean(errores.nombre)} placeholder="Nombre de la persona o entidad" />
          {errores.nombre ? <span className="formulario__error" role="alert">{errores.nombre}</span> : null}
        </label>
        <label>
          Correo
          <input name="correo" type="email" autoComplete="email" value={datos.correo} onChange={cambiar} aria-invalid={Boolean(errores.correo)} placeholder="nombre@institucion.gob.gt" />
          {errores.correo ? <span className="formulario__error" role="alert">{errores.correo}</span> : null}
        </label>
        <label>
          Contraseña
          <span className="acceso__clave">
            <input name="clave" type={visible ? "text" : "password"} autoComplete="new-password" value={datos.clave} onChange={cambiar} aria-invalid={Boolean(errores.clave)} placeholder="Mínimo 8 caracteres" />
            <button type="button" onClick={() => setVisible((valor) => !valor)}>{visible ? "Ocultar" : "Ver"}</button>
          </span>
          {errores.clave ? <span className="formulario__error" role="alert">{errores.clave}</span> : null}
        </label>
        <label>
          Confirmar contraseña
          <input name="confirmar" type={visible ? "text" : "password"} autoComplete="new-password" value={datos.confirmar} onChange={cambiar} aria-invalid={Boolean(errores.confirmar)} placeholder="Repite la contraseña" />
          {errores.confirmar ? <span className="formulario__error" role="alert">{errores.confirmar}</span> : null}
        </label>
        <button type="submit" className="btn btn--naranja btn--bloque">Crear cuenta</button>
      </form>

      <p className="acceso__cambio">
        ¿Ya hay cuenta? <Link to="/ingresar">Ingresar</Link>
      </p>
    </AccesoMarco>
  );
}
