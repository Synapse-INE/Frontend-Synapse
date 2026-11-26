import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, solicitar } from "../../servicios/api";
import "./campana.css";

const DESTINO = {
  admin: "/personal",
  jefe: "/personal",
  trabajador: "/personal",
  solicitante: "/cuenta",
  proveedor: "/proveedor",
};

function hace(iso) {
  const fecha = new Date(iso);
  const minutos = Math.round((Date.now() - fecha.getTime()) / 60000);
  if (minutos < 1) return "Ahora";
  if (minutos < 60) return `Hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `Hace ${horas} h`;
  const dias = Math.round(horas / 24);
  if (dias === 1) return "Ayer";
  if (dias < 7) return `Hace ${dias} días`;
  return fecha.toLocaleDateString("es-GT", { day: "numeric", month: "short" });
}

export function Campana({ rol, onAbrir }) {
  const navigate = useNavigate();
  const caja = useRef(null);
  const [abierta, setAbierta] = useState(false);
  const [datos, setDatos] = useState({ total: 0, noLeidas: 0, notificaciones: [] });
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    try {
      const respuesta = await solicitar("/notificaciones?limite=12");
      setDatos({
        total: respuesta.total || 0,
        noLeidas: respuesta.noLeidas || 0,
        notificaciones: respuesta.notificaciones || [],
      });
    } catch (err) {
      if (!(err instanceof ApiError) || err.status !== 403) setDatos({ total: 0, noLeidas: 0, notificaciones: [] });
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    const reloj = window.setInterval(() => {
      if (document.visibilityState === "visible") cargar();
    }, 60000);
    const alVolver = () => {
      if (document.visibilityState === "visible") cargar();
    };
    const alActualizar = () => cargar();
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("dpir:avisos", alActualizar);
    return () => {
      window.clearInterval(reloj);
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("dpir:avisos", alActualizar);
    };
  }, []);

  useEffect(() => {
    if (!abierta) return undefined;
    function alClic(evento) {
      if (caja.current && !caja.current.contains(evento.target)) setAbierta(false);
    }
    function alEscape(evento) {
      if (evento.key === "Escape") setAbierta(false);
    }
    document.addEventListener("click", alClic);
    document.addEventListener("keydown", alEscape);
    return () => {
      document.removeEventListener("click", alClic);
      document.removeEventListener("keydown", alEscape);
    };
  }, [abierta]);

  async function abrirAviso(aviso) {
    setAbierta(false);
    if (!aviso.leidaEn) {
      try {
        await solicitar(`/notificaciones/${aviso.id}/leer`, { method: "POST" });
      } catch {
        /* El expediente sigue siendo el destino aunque la marca de leído falle. */
      }
    }
    const base = DESTINO[rol] || "/cuenta";
    if (!aviso.solicitud?.id || rol === "proveedor") {
      navigate(base);
      return;
    }
    navigate(`${base}?expediente=${aviso.solicitud.id}&aviso=${aviso.id}`);
  }

  async function leerTodas() {
    try {
      await solicitar("/notificaciones/leer-todas", { method: "POST" });
      await cargar();
    } catch {
      /* La lista se mantiene si la marca no se pudo guardar. */
    }
  }

  const pendientes = datos.noLeidas;

  return (
    <div className="campana" ref={caja}>
      <button
        type="button"
        className={`campana__boton${abierta ? " es-abierta" : ""}`}
        aria-label={pendientes ? `Avisos, ${pendientes} sin leer` : "Avisos"}
        aria-expanded={abierta}
        aria-haspopup="dialog"
        onClick={(evento) => {
          evento.stopPropagation();
          setAbierta((valor) => {
            const siguiente = !valor;
            if (siguiente) {
              onAbrir?.();
              cargar();
            }
            return siguiente;
          });
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
        {pendientes > 0 ? <span className="campana__cuenta">{pendientes > 9 ? "9+" : pendientes}</span> : null}
      </button>
      {abierta ? (
        <div className="campana__panel" role="dialog" aria-label="Avisos del expediente">
          <header>
            <div>
              <strong>Avisos</strong>
              <small>{pendientes ? `${pendientes} sin leer` : "Al día"}</small>
            </div>
            {pendientes > 0 ? (
              <button type="button" onClick={leerTodas}>Marcar leídas</button>
            ) : null}
          </header>
          {cargando ? <p className="campana__vacio">Buscando avisos…</p> : null}
          {!cargando && datos.notificaciones.length === 0 ? (
            <p className="campana__vacio">Cuando una solicitud avance, el aviso aparece aquí.</p>
          ) : null}
          <ul>
            {datos.notificaciones.map((aviso) => (
              <li key={aviso.id}>
                <button type="button" className={aviso.leidaEn ? "" : "es-nueva"} onClick={() => abrirAviso(aviso)}>
                  <span className="campana__punto" aria-hidden="true" />
                  <span>
                    <strong>{aviso.titulo}</strong>
                    <em>{aviso.detalle}</em>
                    <small>
                      {aviso.solicitud?.codigo ? `${aviso.solicitud.codigo} · ` : ""}
                      {hace(aviso.createdAt)}
                    </small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
