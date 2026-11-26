import { useCallback, useEffect, useMemo, useState } from "react";
import { MODALIDADES } from "../../data/precios";
import { asignarSolicitud, listarSolicitudesPersonal } from "../../servicios/portal";
import { Aviso, useAviso } from "./Aviso";
import { ESTADOS, NOMBRE_ESTADO, PROVEEDORES } from "./datos";
import { fechaCorta, fechaDia, iniciales, nombreCorto } from "./formato";
import { Modal } from "./Modal";
import { DIAS_REVISION_LARGA, diasDesde, hace, plazoDe, porUrgencia, situacionPersonal } from "./plazos";
import { useSesion } from "./sesion";
import { Stepper } from "./Stepper";

const ICONOS = {
  nueva: "M12 5v14M5 12h14",
  cotizacion: "M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5",
  revision: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM16 16l5 5",
  cerrada: "M5 12.5l4.5 4.5L19 7.5",
};

const ESTADO_PROVEEDOR = ["Invitado, aún sin cotizar", "Cotización recibida", "Oferta en análisis", "Precio confirmado"];

function Icono({ d, ...props }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d={d} />
    </svg>
  );
}

function normalizar(texto) {
  return String(texto).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function Pill({ tono = "neutra", children }) {
  return <span className={`pill pill--${tono}`}>{children}</span>;
}

function ofertasDe(s) {
  return { total: s.invitados.length, recibidas: s.invitados.filter((i) => i.paso >= 1).length };
}

function Ofertas({ s }) {
  const { total, recibidas } = ofertasDe(s);
  if (!total) return <p className="ofertas ofertas--nada">Aún sin proveedores invitados</p>;
  return (
    <div className="ofertas">
      <p>
        <strong>{recibidas} de {total}</strong> {total === 1 ? "oferta" : "ofertas"}
      </p>
      <span className="ofertas__barra" aria-hidden="true">
        {s.invitados.map((i, n) => (
          <span key={n} className={i.paso >= 1 ? "ofertas__seg ofertas__seg--lleno" : "ofertas__seg"} />
        ))}
      </span>
    </div>
  );
}

function Persona({ nombre }) {
  return (
    <span className="persona">
      <span className="persona__ini" aria-hidden="true">{iniciales(nombre)}</span>
      {nombreCorto(nombre)}
    </span>
  );
}

function Tarjeta({ s, onAbrir, onTomar, ocupada }) {
  const sit = situacionPersonal(s);
  return (
    <article className={`sol${sit.atencion ? " sol--atencion" : ""}`}>
      <div className="sol__cab">
        <p className="sol__num">{s.numero}</p>
        <Pill tono={sit.tono}>{sit.texto}</Pill>
      </div>
      <h3>
        <button type="button" className="sol__abrir" onClick={() => onAbrir(s.id)}>
          {s.titulo}
        </button>
      </h3>
      <p className="sol__inst">{s.institucion}</p>
      <Ofertas s={s} />
      <div className="sol__pie">
        {s.asignadoA ? <Persona nombre={s.asignadoA} /> : <span className="sol__libre">Recibida {hace(s.fecha)}</span>}
        {!s.asignadoA && (
          <button type="button" className="pb pb--chico" disabled={ocupada} onClick={() => onTomar(s)}>
            Tomar
          </button>
        )}
      </div>
    </article>
  );
}

function Detalle({ s, onCerrar, onTomar, ocupada }) {
  const sit = situacionPersonal(s);
  const pasos = ESTADOS.map((e) => ({ id: e.id, titulo: e.etiqueta }));
  const actual = ESTADOS.findIndex((e) => e.id === s.estado);
  const plazo = s.estado === "cotizacion" ? plazoDe(s.limite) : null;
  return (
    <Modal lateral subtitulo={`${s.numero} · ${s.institucion}`} titulo={s.titulo} onCerrar={onCerrar}>
      <div className="modal__marcas">
        <span className={`estado estado--${s.estado}`}>{NOMBRE_ESTADO[s.estado]}</span>
        <Pill tono={sit.tono}>{sit.texto}</Pill>
      </div>

      <dl className="datos">
        <div>
          <dt>Modalidad</dt>
          <dd>{s.modalidad}</dd>
        </div>
        <div>
          <dt>Recibida</dt>
          <dd>{fechaCorta(s.fecha)} ({hace(s.fecha)})</dd>
        </div>
        {plazo && (
          <div>
            <dt>Cierre de cotizaciones</dt>
            <dd>{fechaCorta(s.limite)}</dd>
          </div>
        )}
        <div>
          <dt>Atiende</dt>
          <dd>{s.asignadoA ?? "Sin asignar"}</dd>
        </div>
      </dl>

      <section className="modal__sec" aria-label="Avance de la solicitud">
        <h3>Avance</h3>
        <Stepper pasos={pasos} actual={actual} fechas={[s.fecha]} />
      </section>

      <section className="modal__sec" aria-label="Proveedores invitados">
        <h3>Proveedores invitados</h3>
        {s.invitados.length ? (
          <ul className="invitados">
            {s.invitados.map((i) => (
              <li key={i.proveedorId}>
                <span>{PROVEEDORES[i.proveedorId] ?? i.proveedorId}</span>
                <span className={`invitados__estado${i.paso >= 1 ? " invitados__estado--listo" : ""}`}>
                  {i.accion === "confirmar" ? "Falta que confirme el precio" : ESTADO_PROVEEDOR[i.paso]}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="modal__vacio">Todavía no se invitó a ningún proveedor.</p>
        )}
      </section>

      {!s.asignadoA && (
        <footer className="modal__pie">
          <button type="button" className="pb" disabled={ocupada} onClick={() => onTomar(s)}>
            Tomar esta solicitud
          </button>
        </footer>
      )}
    </Modal>
  );
}

export function InicioPersonalPage() {
  const { usuario } = useSesion();
  const [solicitudes, setSolicitudes] = useState(null);
  const [error, setError] = useState(false);
  const [estado, setEstado] = useState("");
  const [foco, setFoco] = useState("todas");
  const [modalidad, setModalidad] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [vista, setVista] = useState("tablero");
  const [abierta, setAbierta] = useState(null);
  const [ocupada, setOcupada] = useState(false);
  const [aviso, mostrarAviso] = useAviso();

  useEffect(() => {
    let vigente = true;
    listarSolicitudesPersonal()
      .then((datos) => vigente && setSolicitudes(datos))
      .catch(() => vigente && setError(true));
    return () => {
      vigente = false;
    };
  }, []);

  const lista = useMemo(() => solicitudes ?? [], [solicitudes]);

  const tomar = useCallback(
    async (s) => {
      setOcupada(true);
      try {
        const actualizada = await asignarSolicitud(s.id, usuario.nombre);
        setSolicitudes((prev) => prev.map((x) => (x.id === s.id ? actualizada : x)));
        mostrarAviso(`${s.numero} quedó asignada a ti.`);
      } catch {
        mostrarAviso("No se pudo asignar. Intenta de nuevo.");
      } finally {
        setOcupada(false);
      }
    },
    [usuario.nombre, mostrarAviso]
  );

  const resumen = useMemo(() => {
    const por = (id) => lista.filter((s) => s.estado === id);
    const cierres = por("cotizacion").map((s) => s.limite).filter(Boolean).sort();
    const largas = por("revision").filter((s) => !s.invitados.some((i) => i.accion === "confirmar") && diasDesde(s.fecha) >= DIAS_REVISION_LARGA).length;
    const sinAsignar = por("nueva").filter((s) => !s.asignadoA).length;
    return {
      nueva: { n: por("nueva").length, sub: sinAsignar ? `${sinAsignar} sin asignar` : "Todas asignadas" },
      cotizacion: { n: por("cotizacion").length, sub: cierres.length ? `Próximo cierre: ${fechaDia(cierres[0])}` : "Sin cierres próximos" },
      revision: { n: por("revision").length, sub: largas ? `${largas} con más de ${DIAS_REVISION_LARGA} días` : "Al día" },
      cerrada: { n: por("cerrada").length, sub: "Precio de referencia fijado" },
    };
  }, [lista]);

  const conteo = useMemo(
    () => ({
      todas: lista.length,
      atencion: lista.filter((s) => situacionPersonal(s).atencion).length,
      mias: lista.filter((s) => s.asignadoA === usuario.nombre).length,
    }),
    [lista, usuario.nombre]
  );

  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim());
    return lista
      .filter(
        (s) =>
          (!estado || s.estado === estado) &&
          (!modalidad || s.modalidad === modalidad) &&
          (foco !== "atencion" || situacionPersonal(s).atencion) &&
          (foco !== "mias" || s.asignadoA === usuario.nombre) &&
          (!q || normalizar(`${s.numero} ${s.institucion} ${s.titulo}`).includes(q))
      )
      .sort(porUrgencia);
  }, [lista, estado, modalidad, foco, busqueda, usuario.nombre]);

  const hayFiltros = estado || modalidad || busqueda || foco !== "todas";
  const carriles = ESTADOS.filter((e) => !estado || e.id === estado);
  const seleccionada = lista.find((s) => s.id === abierta);

  function limpiar() {
    setEstado("");
    setModalidad("");
    setBusqueda("");
    setFoco("todas");
  }

  return (
    <section className="portal">
      <header className="banda">
        <div className="contenedor banda__in">
          <div>
            <h1>Solicitudes de precio</h1>
            <p>
              {usuario.nombre}, {usuario.cargo}
            </p>
          </div>
          <div className="vista" role="group" aria-label="Forma de ver las solicitudes">
            <button type="button" aria-pressed={vista === "tablero"} onClick={() => setVista("tablero")}>
              Tablero
            </button>
            <button type="button" aria-pressed={vista === "lista"} onClick={() => setVista("lista")}>
              Lista
            </button>
          </div>
        </div>
      </header>

      <div className="contenedor portal__cuerpo">
        {error && (
          <p role="alert" className="formulario__error formulario__error--general">
            No pudimos cargar las solicitudes. Intenta de nuevo más tarde.
          </p>
        )}
        {!solicitudes && !error && (
          <p className="portal__estado" role="status">
            Cargando solicitudes…
          </p>
        )}

        {solicitudes && (
          <>
            <div className="resumen" role="group" aria-label="Solicitudes por estado. Selecciona un estado para filtrar">
              {ESTADOS.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className={`res res--${e.id}`}
                  aria-pressed={estado === e.id}
                  onClick={() => setEstado(estado === e.id ? "" : e.id)}
                >
                  <span className="res__etq">
                    <Icono d={ICONOS[e.id]} className="res__icono" />
                    {e.etiqueta}
                  </span>
                  <span className="res__num">{resumen[e.id].n}</span>
                  <span className="res__sub">{resumen[e.id].sub}</span>
                </button>
              ))}
            </div>

            <div className="barra-filtros">
              <div className="filtro-chips" role="group" aria-label="Qué solicitudes ver">
                {[
                  ["todas", "Todas"],
                  ["atencion", "Requieren atención"],
                  ["mias", "Mías"],
                ].map(([id, etiqueta]) => (
                  <button key={id} type="button" className="filtro-chip" aria-pressed={foco === id} onClick={() => setFoco(id)}>
                    {etiqueta}
                    <span className={`filtro-chip__n${id === "atencion" && conteo.atencion ? " filtro-chip__n--alerta" : ""}`}>{conteo[id]}</span>
                  </button>
                ))}
              </div>
              <div className="filtros">
                <label className="filtros__buscar">
                  <span className="portal-sr">Buscar solicitud</span>
                  <input
                    type="search"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por número, institución o bien"
                  />
                </label>
                <label>
                  <span className="portal-sr">Modalidad</span>
                  <select value={modalidad} onChange={(e) => setModalidad(e.target.value)}>
                    <option value="">Todas las modalidades</option>
                    {MODALIDADES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </label>
                {hayFiltros && (
                  <button type="button" className="enlace-boton" onClick={limpiar}>
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>

            <p className="portal-sr" aria-live="polite">
              Mostrando {visibles.length} de {lista.length} solicitudes
            </p>

            {visibles.length === 0 ? (
              <p className="portal__vacio">
                {foco === "atencion" && !busqueda && !estado && !modalidad
                  ? "Nada requiere atención ahora. Buen trabajo."
                  : "No hay solicitudes con esos filtros. Prueba con otra búsqueda o limpia los filtros."}
              </p>
            ) : vista === "tablero" ? (
              <div className={`panel-tablero${carriles.length === 1 ? " panel-tablero--uno" : ""}`}>
                {carriles.map((e) => {
                  const delCarril = visibles.filter((s) => s.estado === e.id);
                  return (
                    <section key={e.id} className={`carril carril--${e.id}`} aria-label={e.etiqueta}>
                      <header className="carril__cab">
                        <h2>{e.etiqueta}</h2>
                        <span className="carril__cuenta">{delCarril.length}</span>
                      </header>
                      {delCarril.length ? (
                        delCarril.map((s) => <Tarjeta key={s.id} s={s} onAbrir={setAbierta} onTomar={tomar} ocupada={ocupada} />)
                      ) : (
                        <p className="carril__vacio">Nada en este estado.</p>
                      )}
                    </section>
                  );
                })}
              </div>
            ) : (
              <div className="tabla-portal">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Solicitud</th>
                      <th scope="col">Estado</th>
                      <th scope="col">Situación</th>
                      <th scope="col">Ofertas</th>
                      <th scope="col">Atiende</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibles.map((s) => {
                      const sit = situacionPersonal(s);
                      const { total, recibidas } = ofertasDe(s);
                      return (
                        <tr key={s.id}>
                          <td data-etiqueta="Solicitud">
                            <button type="button" className="tabla__abrir" onClick={() => setAbierta(s.id)}>
                              {s.titulo}
                            </button>
                            <span className="tabla__sub">
                              {s.numero} · {s.institucion}
                            </span>
                          </td>
                          <td data-etiqueta="Estado">
                            <span className={`estado estado--${s.estado}`}>{NOMBRE_ESTADO[s.estado]}</span>
                          </td>
                          <td data-etiqueta="Situación">
                            <Pill tono={sit.tono}>{sit.texto}</Pill>
                          </td>
                          <td data-etiqueta="Ofertas">{total ? `${recibidas} de ${total}` : "—"}</td>
                          <td data-etiqueta="Atiende">{s.asignadoA ? nombreCorto(s.asignadoA) : "Sin asignar"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {seleccionada && <Detalle s={seleccionada} onCerrar={() => setAbierta(null)} onTomar={tomar} ocupada={ocupada} />}
      <Aviso texto={aviso} />
    </section>
  );
}
