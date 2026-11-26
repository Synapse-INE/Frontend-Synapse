import { useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import "../../styles/login.css";
import { BotonPrimario } from "./login/BotonPrimario";
import { CampoTexto, MensajeColapsable } from "./login/CampoTexto";
import { CuentasDemo } from "./login/CuentasDemo";
import { IconoCandado, IconoCheck, IconoCorreo, IconoOjo, IconoOjoCerrado } from "./login/Iconos";
import { useLogin } from "./login/useLogin";
import { rutaDeInicio, useSesion } from "./sesion";

const SACUDIDA = [0, -7, 6, -4, 0].map((x) => ({ transform: `translateX(${x}px)` }));
const escalonado = (n) => ({ "--i": n });

export function LoginPage() {
  const { usuario, entrar } = useSesion();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const tarjeta = useRef(null);
  const campos = { correo: useRef(null), clave: useRef(null) };
  const [verClave, setVerClave] = useState(false);
  const [mayusculas, setMayusculas] = useState(false);
  const [ayuda, setAyuda] = useState(false);

  const login = useLogin({
    entrar,
    alExito: (datos) => {
      const inicio = rutaDeInicio(datos.rol);
      const desde = ubicacion.state?.desde;
      navegar(desde?.startsWith(inicio) ? desde : inicio, { replace: true });
    },
    enfocar: (campo) => campos[campo].current?.focus(),
    alFallar: () => {
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        tarjeta.current?.animate(SACUDIDA, { duration: 280, easing: "ease-out" });
      }
    },
  });
  const { valores, errores, validos, estado, mensaje, fallos, entrando, cambiar, tocar, enviar } = login;

  if (usuario && !entrando.current) return <Navigate to={rutaDeInicio(usuario.rol)} replace />;

  const textoError = fallos >= 3 && mensaje ? `${mensaje} Si sigues sin entrar, escribe a info@ine.gob.gt.` : mensaje;
  const revisarMayusculas = (e) => setMayusculas(e.getModifierState?.("CapsLock") ?? false);

  return (
    <section className="lg">
      <div className="lg__fondo" aria-hidden="true" />

      <div ref={tarjeta} className={`lg-card${estado === "exito" ? " lg-card--ok" : ""}`}>
        <header className="lg-cab">
          <h1 className="lg-in" style={escalonado(1)}>
            Bienvenido de vuelta
          </h1>
          <p className="lg-in" style={escalonado(2)}>
            Ingresa para dar seguimiento a tus solicitudes de precios de referencia.
          </p>
        </header>

        <form className="lg-form" onSubmit={enviar} noValidate aria-busy={estado === "cargando"}>
          <CampoTexto
            ref={campos.correo}
            className="lg-in"
            style={escalonado(3)}
            etiqueta="Correo electrónico"
            icono={IconoCorreo}
            type="email"
            name="correo"
            inputMode="email"
            autoComplete="username"
            autoFocus
            value={valores.correo}
            onChange={(e) => cambiar("correo", e.target.value)}
            onBlur={() => tocar("correo")}
            error={errores.correo}
            valido={validos.correo}
          />

          <div className="lg-in" style={escalonado(4)}>
            <CampoTexto
              ref={campos.clave}
              etiqueta="Contraseña"
              icono={IconoCandado}
              type={verClave ? "text" : "password"}
              name="clave"
              autoComplete="current-password"
              value={valores.clave}
              onChange={(e) => cambiar("clave", e.target.value)}
              onBlur={() => {
                tocar("clave");
                setMayusculas(false);
              }}
              onKeyDown={revisarMayusculas}
              onKeyUp={revisarMayusculas}
              error={errores.clave}
              adorno={
                <button
                  type="button"
                  className="lg-ojo"
                  aria-label={verClave ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={verClave}
                  onClick={() => setVerClave((v) => !v)}
                >
                  <IconoOjo className="lg-ojo__abierto" />
                  <IconoOjoCerrado className="lg-ojo__cerrado" />
                </button>
              }
            />
            <MensajeColapsable abierto={mayusculas && !errores.clave} tono="aviso">
              Bloq Mayús está activado.
            </MensajeColapsable>
          </div>

          <div className="lg-opciones lg-in" style={escalonado(5)}>
            <label className="lg-check">
              <input type="checkbox" checked={valores.recordar} onChange={(e) => cambiar("recordar", e.target.checked)} />
              <span className="lg-check__caja" aria-hidden="true">
                <IconoCheck width="14" height="14" strokeWidth="2.6" dibujar />
              </span>
              Recordarme
            </label>
            <button type="button" className="lg-enlace" aria-expanded={ayuda} aria-controls="lg-ayuda" onClick={() => setAyuda((v) => !v)}>
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <MensajeColapsable id="lg-ayuda" abierto={ayuda} tono="info">
            Para restablecerla, escribe a info@ine.gob.gt desde el correo con el que te registraste.
          </MensajeColapsable>

          <MensajeColapsable abierto={!!mensaje} bloque>
            {textoError}
          </MensajeColapsable>

          <BotonPrimario className="lg-in" style={escalonado(6)} estado={estado}>
            Ingresar
          </BotonPrimario>
        </form>

        <div className="lg-sep lg-in" style={escalonado(7)}>
          <span>¿Eres una institución pública?</span>
        </div>
        <Link className="lg-secundario lg-in" style={escalonado(8)} to="/solicitud">
          Solicitar un precio de referencia
        </Link>
      </div>

      <CuentasDemo
        alElegir={(cuenta) => {
          cambiar("correo", cuenta.correo);
          cambiar("clave", cuenta.clave);
        }}
      />

      <p className="lg-sr" role="status">
        {estado === "cargando" ? "Verificando tus datos" : estado === "exito" ? "Ingreso correcto, abriendo tu portal" : ""}
      </p>
    </section>
  );
}
