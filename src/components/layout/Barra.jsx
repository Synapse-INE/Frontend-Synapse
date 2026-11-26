import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logoIne from "../../assets/logo-ine.png";
import { inicialesDe, ROLES } from "../../sesion/roles";
import { useSesion } from "../../sesion/Sesion";
import { AccionSolicitar } from "../../features/solicitud/AvisoCuentaSolicitud";
import { Campana } from "./Campana";

export function Barra() {
  const { sesion, cargando, salir } = useSesion();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [submenuAbierto, setSubmenuAbierto] = useState(false);
  const [cuentaAbierta, setCuentaAbierta] = useState(false);
  const [compacta, setCompacta] = useState(false);
  const itemRef = useRef(null);
  const cuentaRef = useRef(null);
  const rol = sesion ? ROLES[sesion.rol] : null;

  useEffect(() => {
    const alScroll = () => setCompacta(window.scrollY > 12);
    alScroll();
    window.addEventListener("scroll", alScroll, { passive: true });
    return () => window.removeEventListener("scroll", alScroll);
  }, []);

  useEffect(() => {
    function alClic(evento) {
      if (itemRef.current && !itemRef.current.contains(evento.target)) setSubmenuAbierto(false);
      if (cuentaRef.current && !cuentaRef.current.contains(evento.target)) setCuentaAbierta(false);
    }
    function alEscape(evento) {
      if (evento.key !== "Escape") return;
      setSubmenuAbierto(false);
      setCuentaAbierta(false);
      setMenuAbierto(false);
    }
    document.addEventListener("click", alClic);
    document.addEventListener("keydown", alEscape);
    return () => {
      document.removeEventListener("click", alClic);
      document.removeEventListener("keydown", alEscape);
    };
  }, []);

  function cerrar() {
    setMenuAbierto(false);
    setSubmenuAbierto(false);
    setCuentaAbierta(false);
  }

  async function cerrarSesion() {
    await salir();
    cerrar();
    navigate("/");
  }

  return (
    <header className={`barra${compacta ? " barra--compacta" : ""}${menuAbierto ? " barra--abierta" : ""}`}>
      <div className="barra__fondo" />
      <nav className="barra__nav" aria-label="Principal">
        <ul className={`menu${menuAbierto ? " menu--abierto" : ""}`}>
          <li>
            <NavLink className="menu__enlace" to="/" end onClick={cerrar}>
              Inicio
            </NavLink>
          </li>
          <li className={`menu__item-desplegable${submenuAbierto ? " abierto" : ""}`} ref={itemRef}>
            <button
              className="menu__enlace menu__boton"
              type="button"
              aria-expanded={submenuAbierto}
              aria-controls="submenu-precios"
              onClick={(evento) => {
                evento.stopPropagation();
                setSubmenuAbierto((valor) => !valor);
              }}
            >
              Precios referenciales
              <svg viewBox="0 0 12 8" aria-hidden="true">
                <path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <ul className="submenu" id="submenu-precios">
              <li>
                <Link to="/lista" onClick={cerrar}>Lista de precios</Link>
              </li>
              <li>
                <AccionSolicitar onIr={cerrar}>Solicitud de precios</AccionSolicitar>
              </li>
            </ul>
          </li>
          <li className="menu__sesion">
            {sesion ? (
              <button type="button" className="menu__enlace" onClick={cerrarSesion}>Cerrar sesión</button>
            ) : (
              <>
                <Link className="menu__enlace" to="/ingresar" onClick={cerrar}>Ingresar</Link>
                <Link className="menu__enlace" to="/registro" onClick={cerrar}>Registrarse</Link>
              </>
            )}
          </li>
        </ul>

        <Link className="marca" to="/" onClick={cerrar}>
          <img src={logoIne} alt="Instituto Nacional de Estadística" />
        </Link>

        <div className="barra__acciones">
          {cargando || !sesion ? null : (
            <Campana rol={sesion.rol} onAbrir={() => setCuentaAbierta(false)} />
          )}
          {cargando ? null : sesion ? (
            <div className="barra__cuenta-caja" ref={cuentaRef}>
              <button
                type="button"
                className="barra__cuenta"
                aria-expanded={cuentaAbierta}
                aria-haspopup="dialog"
                onClick={(evento) => {
                  evento.stopPropagation();
                  setCuentaAbierta((valor) => !valor);
                }}
              >
                <span className="barra__avatar" aria-hidden="true">{inicialesDe(sesion.nombre)}</span>
                <span className="barra__cuenta-texto">
                  <strong>{sesion.nombre}</strong>
                  <small>{rol.etiqueta}</small>
                </span>
              </button>
              {cuentaAbierta ? (
                <div className="barra__popover" role="dialog" aria-label="Sesión">
                  <p>{rol.resumen}</p>
                  <Link to={rol.destino} onClick={cerrar}>Mi espacio</Link>
                  {sesion.rol === "solicitante" && sesion.estadoRevision === "aprobado" ? <Link to="/solicitud" onClick={cerrar}>Nueva solicitud</Link> : null}
                  {sesion.rol === "proveedor" ? <Link to="/proveedor" onClick={cerrar}>Mis productos</Link> : null}
                  {sesion.rol === "jefe" || sesion.rol === "trabajador" || sesion.rol === "admin" ? <Link to="/personal" onClick={cerrar}>Bandeja</Link> : null}
                  <button type="button" onClick={cerrarSesion}>Cerrar sesión</button>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <Link className="barra__entrar" to="/ingresar">Ingresar</Link>
              <Link className="barra__registro" to="/registro">Registrarse</Link>
            </>
          )}
          <button
            className={`hamburguesa${menuAbierto ? " abierta" : ""}`}
            type="button"
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuAbierto}
            onClick={() => setMenuAbierto((valor) => !valor)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>
    </header>
  );
}
