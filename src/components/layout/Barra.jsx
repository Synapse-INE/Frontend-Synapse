import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import logoIne from "../../assets/logo-ine.png";
import { rutaDeInicio, useSesion } from "../../features/portal/sesion";
import { Boton } from "../ui/Boton";

export function Barra() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [submenuAbierto, setSubmenuAbierto] = useState(false);
  const itemRef = useRef(null);
  const { usuario, salir } = useSesion();

  useEffect(() => {
    function alClic(evento) {
      if (itemRef.current && !itemRef.current.contains(evento.target)) {
        setSubmenuAbierto(false);
      }
    }
    document.addEventListener("click", alClic);
    return () => document.removeEventListener("click", alClic);
  }, []);

  function cerrar() {
    setMenuAbierto(false);
    setSubmenuAbierto(false);
  }

  return (
    <header className="barra">
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
              onClick={(e) => {
                e.stopPropagation();
                setSubmenuAbierto((v) => !v);
              }}
            >
              Precios referenciales
              <svg viewBox="0 0 12 8" aria-hidden="true">
                <path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <ul className="submenu" id="submenu-precios" role="menu">
              <li>
                <Link to="/lista" onClick={cerrar}>
                  Lista de precios
                </Link>
              </li>
              <li>
                <Link to="/solicitud" onClick={cerrar}>
                  Solicitud de precios
                </Link>
              </li>
            </ul>
          </li>
          {usuario ? (
            <>
              <li>
                <NavLink className="menu__enlace" to={rutaDeInicio(usuario.rol)} onClick={cerrar}>
                  Mi portal
                </NavLink>
              </li>
              <li>
                <button
                  className="menu__enlace menu__salir"
                  type="button"
                  onClick={() => {
                    salir();
                    cerrar();
                  }}
                >
                  Salir
                </button>
              </li>
            </>
          ) : (
            <li>
              <NavLink className="menu__enlace" to="/login" onClick={cerrar}>
                Ingresar
              </NavLink>
            </li>
          )}
        </ul>

        <Link className="marca" to="/" onClick={cerrar}>
          <img src={logoIne} alt="Instituto Nacional de Estadística" />
        </Link>

        <div className="barra__acciones">
          <Boton className="barra__cta" variante="naranja" to="/solicitud">
            Solicitar precio
          </Boton>
          <button
            className="hamburguesa"
            type="button"
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuAbierto}
            onClick={() => setMenuAbierto((v) => !v)}
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
