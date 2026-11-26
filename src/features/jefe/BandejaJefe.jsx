import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ApiError, descargarArchivo, solicitar } from "../../servicios/api";
import { formatearFecha } from "../../data/precios";
import { useSesion } from "../../sesion/Sesion";
import { indiceActivo, PASOS_EXPEDIENTE } from "../solicitud/PasosExpediente";
import { GRUPOS, accionDe, grupoDe, tituloGrupo } from "./grupos";
import {
  CORTES_TRABAJADOR,
  GRUPOS_TRABAJADOR,
  accionDeTrabajador,
  entraEnCorteTrabajador,
  involucra,
} from "./gruposTrabajador";
import { DetalleExpedientePanel } from "./DetalleExpedientePanel";
import { avisosActualizados } from "../../servicios/avisosUi";
import { runTourJefe, useTourJefe } from "../../tours/tourJefe";
import { runTourTrabajador, useTourTrabajador } from "../../tours/tourTrabajador";
import "./bandejaJefe.css";

const ESTADOS = {
  RECIBIDA: "Recibida",
  EN_REVISION: "En revisión",
  PENDIENTE_SUBSANACION: "En corrección",
  EN_INVESTIGACION: "En investigación",
  EN_ANALISIS: "En análisis",
  EN_INFORME: "En informe",
  EN_ENTREGA: "En entrega",
  COMPLETADA: "Completada",
  RECHAZADA: "Rechazada",
  EN_ESPERA: "En espera",
  CANCELADA: "Anulada",
};

const CERRADOS = new Set(["COMPLETADA", "RECHAZADA", "CANCELADA"]);
const EN_TRAMITE = new Set(["corr", "espera", "curso"]);

const CORTES = [
  { id: "sin", titulo: "Sin asignar", nota: "Esperan un trabajador", tono: "naranja", icono: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 8v6M22 11h-6" },
  { id: "venc", titulo: "Por vencer", nota: "Plazo cumplido o a dos días", tono: "rojo", icono: "M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0" },
  { id: "tramite", titulo: "En trámite", nota: "Con un responsable", tono: "azul", icono: "M4 6h16M4 12h10M4 18h7M16 16l2 2 4-4" },
  { id: "cerradas", titulo: "Cerradas", nota: "Atendidas o anuladas", tono: "lima", icono: "M20 7 9 18l-5-5" },
];

function iniciales(nombre) {
  const partes = String(nombre || "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "—";
  return (partes[0][0] + (partes[1]?.[0] || "")).toUpperCase();
}

function claseEstado(estado) {
  if (estado === "COMPLETADA") return "chip chip--ok";
  if (["RECHAZADA", "CANCELADA"].includes(estado)) return "chip chip--aviso";
  if (estado === "PENDIENTE_SUBSANACION") return "chip chip--aviso";
  if (estado === "BORRADOR") return "chip chip--neutro";
  return "chip";
}

function fechaExpediente(solicitud) {
  const crudo = solicitud.enviadaEn || solicitud.createdAt;
  if (!crudo) return "—";
  const texto = typeof crudo === "string" ? crudo.slice(0, 10) : crudo;
  return formatearFecha(texto);
}

function coincide(solicitud, texto) {
  if (!texto) return true;
  const busqueda = texto.toLowerCase();
  return [solicitud.codigo, solicitud.titulo, solicitud.institucionSolicitante, solicitud.asignadaA?.nombre]
    .filter(Boolean)
    .some((valor) => String(valor).toLowerCase().includes(busqueda));
}

function entraEnCorte(solicitud, corte) {
  const grupo = grupoDe(solicitud);
  if (corte === "sin" || corte === "venc") return grupo === corte;
  if (corte === "tramite") return EN_TRAMITE.has(grupo);
  if (corte === "cerradas") return !grupo;
  return true;
}

export function BandejaJefe() {
  useTourJefe();
  return <BandejaMesa modo="jefe" />;
}

export function BandejaTrabajador() {
  useTourTrabajador();
  return <BandejaMesa modo="trabajador" />;
}

function BandejaMesa({ modo }) {
  const esJefe = modo === "jefe";
  const { sesion } = useSesion();
  const usuarioId = sesion?.id;
  const CORTES_ACTIVOS = esJefe ? CORTES : CORTES_TRABAJADOR;
  const GRUPOS_ACTIVOS = esJefe ? GRUPOS : GRUPOS_TRABAJADOR;
  const [params, setParams] = useSearchParams();
  const [vista, setVista] = useState("atencion");
  const [corte, setCorte] = useState("");
  const [solicitudes, setSolicitudes] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [seleccion, setSeleccion] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [adjuntos, setAdjuntos] = useState([]);
  const [responsable, setResponsable] = useState("");
  const [apoyo, setApoyo] = useState("");
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");

  async function cargarLista(silencioso) {
    if (silencioso) setRefrescando(true);
    else setCargando(true);
    setError("");
    try {
      const datos = await solicitar("/solicitudes?limite=100");
      setSolicitudes(datos.solicitudes || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar la bandeja.");
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }

  useEffect(() => {
    const id = params.get("expediente");
    if (id) setSeleccion(id);
  }, [params]);

  useEffect(() => {
    cargarLista(false);
    if (esJefe) {
      solicitar("/personal-ine")
        .then((datos) => setPersonal(Array.isArray(datos) ? datos : []))
        .catch(() => setPersonal([]));
    }
  }, [esJefe]);

  useEffect(() => {
    if (!seleccion) {
      setDetalle(null);
      setAdjuntos([]);
      return undefined;
    }
    let viva = true;
    setResponsable("");
    setApoyo("");
    Promise.all([
      solicitar(`/solicitudes/${seleccion}`),
      solicitar(`/solicitudes/${seleccion}/adjuntos`),
    ])
      .then(([caso, archivos]) => {
        if (!viva) return;
        setDetalle(caso);
        setAdjuntos(archivos.adjuntos || []);
      })
      .catch((err) => {
        if (viva) setError(err instanceof ApiError ? err.message : "No se pudo abrir la solicitud.");
      });
    return () => {
      viva = false;
    };
  }, [seleccion]);

  const conteos = useMemo(() => {
    if (esJefe) {
      return {
        sin: solicitudes.filter((item) => grupoDe(item) === "sin").length,
        venc: solicitudes.filter((item) => grupoDe(item) === "venc").length,
        tramite: solicitudes.filter((item) => EN_TRAMITE.has(grupoDe(item))).length,
        cerradas: solicitudes.filter((item) => !grupoDe(item)).length,
      };
    }
    return {
      mias: solicitudes.filter((item) => item.asignadaAId === usuarioId && Boolean(grupoDe(item))).length,
      apoyo: solicitudes.filter((item) => entraEnCorteTrabajador(item, "apoyo", usuarioId)).length,
      venc: solicitudes.filter((item) => grupoDe(item) === "venc" && involucra(item, usuarioId)).length,
      cerradas: solicitudes.filter((item) => !grupoDe(item) && involucra(item, usuarioId)).length,
    };
  }, [solicitudes, esJefe, usuarioId]);

  const visibles = useMemo(() => {
    const base = solicitudes.filter((item) => coincide(item, busqueda.trim()) && (!estado || item.estado === estado));
  const filtroCorte = (item) => {
      if (vista === "todas" || !corte) return true;
      if (esJefe) return entraEnCorte(item, corte);
      return entraEnCorteTrabajador(item, corte, usuarioId);
    };
    const filtroVista = (item) => {
      if (vista === "todas" || esJefe) return true;
      return involucra(item, usuarioId);
    };
    return base.filter((item) => filtroVista(item) && filtroCorte(item));
  }, [solicitudes, busqueda, estado, vista, corte, esJefe, usuarioId]);

  const porGrupo = useMemo(() => {
    const mapa = Object.fromEntries(GRUPOS_ACTIVOS.map((grupo) => [grupo.id, []]));
    if (esJefe) {
      visibles.forEach((item) => {
        const grupo = grupoDe(item);
        if (grupo) mapa[grupo].push(item);
      });
    } else {
      visibles.filter((item) => involucra(item, usuarioId)).forEach((item) => {
        const grupo = item.asignadaAId === usuarioId ? "mias" : "apoyo";
        if (mapa[grupo]) mapa[grupo].push(item);
      });
    }
    return mapa;
  }, [visibles, esJefe, usuarioId, GRUPOS_ACTIVOS]);

  const gruposConCasos = GRUPOS_ACTIVOS.filter((grupo) => porGrupo[grupo.id].length > 0);
  const corteActivo = CORTES_ACTIVOS.find((item) => item.id === corte);

  function elegirCorte(id) {
    setVista("atencion");
    setBusqueda("");
    setEstado("");
    setCorte((actual) => (actual === id ? "" : id));
  }

  function aplicarAsignacion(caso) {
    setDetalle(caso);
    setSolicitudes((lista) => lista.map((item) => (item.id === caso.id
      ? { ...item, asignadaAId: caso.asignadaAId, asignadaA: caso.asignadaA, estado: caso.estado, atencion: caso.atencion }
      : item)));
  }

  async function asignar(evento) {
    evento.preventDefault();
    if (!seleccion || !responsable) return;
    setOcupado(true);
    setError("");
    try {
      aplicarAsignacion(await solicitar(`/solicitudes/${seleccion}/asignar`, {
        method: "POST",
        cuerpo: { usuarioId: responsable },
      }));
      avisosActualizados();
      setResponsable("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo asignar.");
    } finally {
      setOcupado(false);
    }
  }

  async function agregarApoyo(evento) {
    evento.preventDefault();
    if (!seleccion || !apoyo) return;
    setOcupado(true);
    setError("");
    try {
      setDetalle(await solicitar(`/solicitudes/${seleccion}/colaboradores`, {
        method: "POST",
        cuerpo: { usuarioId: apoyo },
      }));
      setApoyo("");
      avisosActualizados();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo agregar el apoyo.");
    } finally {
      setOcupado(false);
    }
  }

  async function quitarApoyo(usuarioId) {
    setOcupado(true);
    setError("");
    try {
      setDetalle(await solicitar(`/solicitudes/${seleccion}/colaboradores/${usuarioId}`, { method: "DELETE" }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo quitar el apoyo.");
    } finally {
      setOcupado(false);
    }
  }

  const cerrado = detalle ? CERRADOS.has(detalle.estado) : false;
  const apoyoDisponible = personal.filter((persona) => persona.id !== detalle?.asignadaAId && !(detalle?.colaboradores || []).some((item) => item.usuario.id === persona.id));

  function abrirExpediente(id) {
    setSeleccion(id);
    setParams({ expediente: id }, { replace: true });
  }

  function cerrarExpediente() {
    setSeleccion(null);
    setParams({}, { replace: true });
  }

  useEffect(() => {
    if (!seleccion) return undefined;
    function alTecla(evento) {
      if (evento.key === "Escape") cerrarExpediente();
    }
    document.addEventListener("keydown", alTecla);
    return () => document.removeEventListener("keydown", alTecla);
  }, [seleccion]);

  const totalBandeja = (esJefe ? solicitudes.length : solicitudes.filter((item) => involucra(item, usuarioId)).length) || 1;
  const prefijoId = esJefe ? "jefe" : "trab";
  const tituloBandeja = esJefe ? "Bandeja del jefe" : "Bandeja del trabajador";
  const textoBandeja = esJefe
    ? "Cada solicitud espera un trabajador. Desde aquí la asignas y sigues el tiempo de atención."
    : "Atiendes los expedientes que tienes a cargo o en los que colaboras. El jefe asigna cada solicitud.";
  const runTour = esJefe ? runTourJefe : runTourTrabajador;

  return (
    <div className="mesa">
      <div className="mesa__contenedor">
      <header className="mesa__encabezado">
        <div className="mesa__encabezado-texto" id={`${prefijoId}-titulo`}>
          <p className="mesa__kicker">Dirección de Precios e Índices de Referencia</p>
          <div className="mesa__titulo-fila" id={`${prefijoId}-info-titulo`}>
            <h1>{tituloBandeja}</h1>
            <button type="button" className="mesa-tutorial" id={`${prefijoId}-tutorial`} onClick={() => runTour()}>
              Tutorial
            </button>
          </div>
          <p>{textoBandeja}</p>
        </div>
        <div className="mesa__plazo" id={`${prefijoId}-plazo`}>
          <strong>15</strong>
          <span>días desde el envío</span>
          <button type="button" onClick={() => cargarLista(true)} disabled={refrescando}>
            {refrescando ? "Actualizando…" : "Actualizar"}
          </button>
        </div>
      </header>

      <div className="mesa__kpis" id={`${prefijoId}-kpis`}>
        {CORTES_ACTIVOS.map((item) => {
          const cantidad = conteos[item.id];
          return (
          <button
            key={item.id}
            type="button"
            className={`mesa__kpi mesa__kpi--${item.tono}${corte === item.id && vista === "atencion" ? " es-activo" : ""}`}
            aria-pressed={corte === item.id && vista === "atencion"}
            onClick={() => elegirCorte(item.id)}
          >
            <span className="mesa__kpi-icono" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d={item.icono} /></svg>
            </span>
            <span className="mesa__kpi-texto">
              <small>{item.titulo}</small>
              <strong>{cantidad}</strong>
              <em>{item.nota}</em>
              <span className="mesa__kpi-track" aria-hidden="true">
                <i style={{ "--p": `${Math.min(100, Math.round((cantidad / totalBandeja) * 100))}%` }} />
              </span>
            </span>
          </button>
          );
        })}
      </div>

      {error ? <p className="mesa__aviso" role="alert">{error}</p> : null}

      <div className="mesa__lienzo">
        <section className="mesa__lista" id={`${prefijoId}-lista`} aria-label={vista === "atencion" ? "Mis expedientes" : "Todas las solicitudes"}>
          <div className="mesa__barra" id={`${prefijoId}-barra`}>
            <div className="mesa__vistas" role="tablist" aria-label="Forma de ver la bandeja">
              <button type="button" role="tab" aria-selected={vista === "atencion"} onClick={() => { setVista("atencion"); setEstado(""); }}>
                {esJefe ? "Por atender" : "Mis expedientes"}
              </button>
              <button type="button" role="tab" aria-selected={vista === "todas"} onClick={() => { setVista("todas"); setCorte(""); }}>
                Todas
              </button>
            </div>
            <label className="mesa__buscar">
              <span className="sr-only">Buscar</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <input
                value={busqueda}
                onChange={(evento) => {
                  setBusqueda(evento.target.value);
                  if (evento.target.value) {
                    setVista("todas");
                    setCorte("");
                  }
                }}
                placeholder="Código, título, entidad o trabajador"
              />
            </label>
            {vista === "todas" ? (
              <label className="mesa__estado">
                <span className="sr-only">Estado</span>
                <select value={estado} onChange={(evento) => setEstado(evento.target.value)}>
                  <option value="">Cualquier estado</option>
                  {Object.entries(ESTADOS).map(([codigo, etiqueta]) => <option key={codigo} value={codigo}>{etiqueta}</option>)}
                </select>
              </label>
            ) : null}
            {!cargando ? (
              <p className="mesa__conteo" aria-live="polite">
                {visibles.length} {visibles.length === 1 ? "expediente" : "expedientes"}
              </p>
            ) : null}
          </div>

          <div className="mesa__scroll">
            {cargando ? <p className="mesa__vacio">Cargando los expedientes…</p> : null}

            {!cargando && vista === "atencion" && corteActivo && visibles.length === 0 ? (
              <Escena
                esJefe={esJefe}
                titulo={`${corteActivo.titulo} está despejado`}
                texto="No hay expedientes en este grupo. Pulsa la tarjeta otra vez para volver a ver toda la bandeja."
              />
            ) : null}

            {!cargando && vista === "atencion" && corteActivo && visibles.length > 0 ? (
              <section className="mesa__grupo">
                <header>
                  <div>
                    <h2>{corteActivo.titulo}</h2>
                    <p>{corteActivo.nota}</p>
                  </div>
                  <b>{visibles.length}</b>
                </header>
                <div className="mesa__casos">
                  {visibles.map((item) => (
                    <Fila key={item.id} solicitud={item} activa={item.id === seleccion} onAbrir={() => abrirExpediente(item.id)} esJefe={esJefe} usuarioId={usuarioId} />
                  ))}
                </div>
              </section>
            ) : null}

            {!cargando && vista === "atencion" && !corte && gruposConCasos.length === 0 ? (
              <Escena
                esJefe={esJefe}
                titulo={esJefe ? "La bandeja está al día" : "No tienes expedientes pendientes"}
                texto={esJefe
                  ? "Cuando una entidad envíe su solicitud, el expediente aparece aquí para que elijas al trabajador."
                  : "Cuando el jefe te asigne un expediente o te sume como apoyo, aparecerá aquí."}
              />
            ) : null}

            {!cargando && vista === "atencion" && !corte && gruposConCasos.map((grupo) => (
              <section key={grupo.id} className="mesa__grupo">
                <header>
                  <i className={`mesa__marca mesa__marca--${grupo.tono}`} aria-hidden="true" />
                  <div>
                    <h2>{grupo.titulo}</h2>
                    <p>{grupo.ayuda}</p>
                  </div>
                  <b>{porGrupo[grupo.id].length}</b>
                </header>
                <div className="mesa__casos">
                  {porGrupo[grupo.id].map((item) => (
                    <Fila key={item.id} solicitud={item} activa={item.id === seleccion} onAbrir={() => abrirExpediente(item.id)} esJefe={esJefe} usuarioId={usuarioId} />
                  ))}
                </div>
              </section>
            ))}

            {!cargando && vista === "todas" && visibles.length === 0 ? (
              <p className="mesa__vacio">Ningún expediente coincide con esa búsqueda.</p>
            ) : null}
            {!cargando && vista === "todas" && visibles.length > 0 ? (
              <div className="mesa__casos">
                {visibles.map((item) => (
                  <Fila key={item.id} solicitud={item} activa={item.id === seleccion} onAbrir={() => abrirExpediente(item.id)} esJefe={esJefe} usuarioId={usuarioId} />
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </div>
      </div>

      <button
        type="button"
        className={`mesa__velo${seleccion ? " es-visible" : ""}`}
        aria-hidden={!seleccion}
        tabIndex={seleccion ? 0 : -1}
        onClick={cerrarExpediente}
        aria-label="Cerrar expediente"
      />

      <aside
        id={`${prefijoId}-expediente`}
        className={`mesa__expediente mesa__expediente--cajon${seleccion ? " es-abierto" : ""}`}
        aria-label="Expediente"
        aria-hidden={!seleccion}
      >
        {seleccion ? (
            <>
              <header className="mesa__expediente-cabecera">
                <div className="mesa__expediente-cabecera-fila">
                  <div className="mesa__sellos">
                    <span className="mesa__codigo">{detalle?.codigo || "Abriendo expediente…"}</span>
                    {detalle ? (
                      <span className={`mesa__estado-pill mesa__estado-pill--${claseEstado(detalle.estado).replace("chip chip--", "").replace("chip", "base")}`}>
                        {ESTADOS[detalle.estado] || detalle.estado}
                      </span>
                    ) : null}
                    {detalle && grupoDe(detalle) ? (
                      <span className={`mesa__prioridad mesa__prioridad--${grupoDe(detalle)}`}>{tituloGrupo(grupoDe(detalle))}</span>
                    ) : null}
                  </div>
                  <button type="button" className="mesa__cerrar" onClick={cerrarExpediente} aria-label="Cerrar expediente">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
                  </button>
                </div>
                <div className="mesa__expediente-hero">
                  <div className="mesa__expediente-hero-texto">
                    <h2>{detalle?.titulo || "Solicitud"}</h2>
                    {detalle?.institucionSolicitante ? (
                      <p className="mesa__entidad"><Icono d={ICONO_ENTIDAD} />{detalle.institucionSolicitante}</p>
                    ) : null}
                  </div>
                  {detalle?.atencion ? <Plazo atencion={detalle.atencion} /> : null}
                </div>
                {detalle ? (
                  <div className="mesa__expediente-etapas">
                    <ProgresoEtapas solicitud={detalle} />
                  </div>
                ) : null}
              </header>
              {detalle ? (
                <DetalleExpedientePanel
                  detalle={detalle}
                  adjuntos={adjuntos}
                  esJefe={esJefe}
                  sesion={sesion}
                  cerrado={cerrado}
                  responsable={responsable}
                  setResponsable={setResponsable}
                  apoyo={apoyo}
                  setApoyo={setApoyo}
                  personal={personal}
                  apoyoDisponible={apoyoDisponible}
                  ocupado={ocupado}
                  asignar={asignar}
                  agregarApoyo={agregarApoyo}
                  quitarApoyo={quitarApoyo}
                  iniciales={iniciales}
                  setDetalle={setDetalle}
                  setError={setError}
                  onLista={() => { cargarLista(false); avisosActualizados(); }}
                />
              ) : <p className="mesa__expediente-cuerpo">Cargando el expediente…</p>}
            </>
        ) : null}
      </aside>
    </div>
  );
}

function Escena({ titulo, texto, esJefe }) {
  return (
    <div className="mesa__escena">
      <div>
        <p className="mesa__kicker">{esJefe ? "Por atender" : "Mis expedientes"}</p>
        <h2>{titulo}</h2>
        <p>{texto}</p>
      </div>
      <ol>
        <li><b>1</b><strong>Llega</strong><span>La entidad envía el expediente.</span></li>
        {esJefe ? (
          <li><b>2</b><strong>Asignas</strong><span>Eliges al trabajador del INE.</span></li>
        ) : (
          <li><b>2</b><strong>Te asignan</strong><span>El jefe te nombra responsable o apoyo.</span></li>
        )}
        <li><b>3</b><strong>Atiendes</strong><span>El equipo responde en 15 días.</span></li>
      </ol>
    </div>
  );
}

const PLAZO_DIAS = 15;

function Icono({ d }) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const ICONO_ENTIDAD = "M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6";
const ICONO_CAJA = "M21 8 12 3 3 8v8l9 5 9-5V8ZM3 8l9 5 9-5M12 13v8";
const ICONO_CALENDARIO = "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z";

function Plazo({ atencion }) {
  if (!atencion) return null;
  const { situacion, diasRestantes, venceEn } = atencion;
  const atendida = situacion === "ATENDIDA" || situacion === "ATENDIDA_FUERA_DE_PLAZO";
  const vencida = situacion === "VENCIDA" || situacion === "VENCE_HOY";
  const detenida = situacion === "EN_SUBSANACION";
  const dias = Math.max(0, diasRestantes ?? 0);
  const consumido = atendida ? 1 : Math.min(1, Math.max(0, (PLAZO_DIAS - dias) / PLAZO_DIAS));
  const tono = atendida
    ? situacion === "ATENDIDA" ? "ok" : "mal"
    : vencida ? "mal" : dias <= 3 ? "alerta" : detenida ? "pausa" : "ok";
  const radio = 17;
  const circ = 2 * Math.PI * radio;

  let valor = String(dias);
  let unidad = dias === 1 ? "día" : "días";
  if (atendida) { valor = "✓"; unidad = situacion === "ATENDIDA" ? "a tiempo" : "tarde"; }
  else if (situacion === "VENCE_HOY") { valor = "Hoy"; unidad = "vence"; }
  else if (situacion === "VENCIDA") { valor = `+${Math.abs(diasRestantes)}`; unidad = "vencido"; }

  return (
    <div className={`mesa__plazo-anillo mesa__plazo-anillo--${tono}`} title={venceEn ? `Vence el ${venceEn}` : undefined}>
      <svg viewBox="0 0 44 44" aria-hidden="true">
        <circle cx="22" cy="22" r={radio} className="mesa__plazo-fondo" />
        <circle
          cx="22"
          cy="22"
          r={radio}
          className="mesa__plazo-valor"
          strokeDasharray={circ}
          strokeDashoffset={circ * consumido}
        />
      </svg>
      <span className="mesa__plazo-centro">
        <strong>{valor}</strong>
        <small>{unidad}</small>
      </span>
    </div>
  );
}

function ProgresoEtapas({ solicitud }) {
  const { estado, historial } = solicitud;
  if (["RECHAZADA", "CANCELADA"].includes(estado)) {
    return <span className="mesa__etapas-texto mesa__etapas-texto--fin">{ESTADOS[estado]}</span>;
  }
  const activo = indiceActivo(estado, historial);
  const total = PASOS_EXPEDIENTE.length;
  const completado = estado === "COMPLETADA";
  const etiqueta = completado ? "Completada" : ESTADOS[estado] || estado;
  return (
    <div className="mesa__etapas">
      <div className="mesa__etapas-cabeza">
        <span className="mesa__etapas-texto">{etiqueta}</span>
        <span className="mesa__etapas-paso">{completado ? total : Math.min(activo + 1, total)}/{total}</span>
      </div>
      <div className="mesa__etapas-barra" aria-hidden="true">
        {PASOS_EXPEDIENTE.map(([codigo], indice) => (
          <span
            key={codigo}
            className={completado || indice < activo ? "es-hecho" : indice === activo ? "es-actual" : ""}
          />
        ))}
      </div>
    </div>
  );
}

function Fila({ solicitud, activa, onAbrir, esJefe, usuarioId }) {
  const persona = solicitud.asignadaA?.nombre;
  const grupo = grupoDe(solicitud) || "cerrada";
  const productos = solicitud._count?.productos;
  const prioridad = grupo !== "cerrada" && grupo !== "curso" && grupo !== "mias" ? tituloGrupo(grupo) : "";
  const accion = esJefe ? accionDe(solicitud) : accionDeTrabajador(solicitud, usuarioId);

  return (
    <button type="button" className={`mesa__caso mesa__caso--${grupo}${activa ? " es-activo" : ""}`} onClick={onAbrir}>
      <div className="mesa__caso-principal">
        <div className="mesa__caso-etiquetas">
          <span className="mesa__caso-codigo">{solicitud.codigo}</span>
          {prioridad ? <span className={`mesa__prioridad mesa__prioridad--${grupo}`}>{prioridad}</span> : null}
        </div>
        <p className="mesa__caso-titulo">{solicitud.titulo}</p>
        <div className="mesa__caso-datos">
          {solicitud.institucionSolicitante ? (
            <span><Icono d={ICONO_ENTIDAD} />{solicitud.institucionSolicitante}</span>
          ) : null}
          {productos != null ? (
            <span><Icono d={ICONO_CAJA} />{productos} producto{productos === 1 ? "" : "s"}</span>
          ) : null}
          <span><Icono d={ICONO_CALENDARIO} />{fechaExpediente(solicitud)}</span>
        </div>
      </div>

      <div className="mesa__caso-avance">
        <ProgresoEtapas solicitud={solicitud} />
      </div>

      <div className="mesa__caso-lateral">
        <Plazo atencion={solicitud.atencion} />
        <span className={`mesa__avatar${persona ? "" : " mesa__avatar--vacio"}`} title={persona || "Sin asignar"}>
          {persona ? iniciales(persona) : "?"}
        </span>
        <span className="mesa__caso-cta" aria-hidden="true">
          {accion}
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </span>
      </div>
    </button>
  );
}
