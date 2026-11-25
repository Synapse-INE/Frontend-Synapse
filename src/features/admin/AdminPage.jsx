import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TIPOS_MODALIDAD } from "../../data/modalidades";
import { anotar, detalleDe, fijarModalidad, leerBitacora, modalidadesApagadas } from "../../sesion/bitacora";
import {
  CUENTAS,
  ROLES,
  actualizarCuenta,
  cuentasDisponibles,
  estaBloqueada,
  fijarBloqueo,
  guardarCuenta,
  inicialesDe,
} from "../../sesion/roles";
import { useSesion } from "../../sesion/Sesion";

const ROLES_ALTA = ["trabajador", "proveedor"];
const ROLES_FILTRO = ["admin", "trabajador", "proveedor", "solicitante"];
const POR_PAGINA = 8;
const NAV = [
  { grupo: "Gestión", items: [{ id: "resumen", titulo: "Resumen", icono: "M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" }] },
  {
    grupo: "Personas",
    items: [
      { id: "usuarios", titulo: "Usuarios", icono: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
      { id: "pendientes", titulo: "En revisión", icono: "M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0" },
    ],
  },
  { grupo: "Catálogo", items: [{ id: "modalidades", titulo: "Modalidades", icono: "M4 7h16M4 12h16M4 17h10" }] },
  { grupo: "Control", items: [{ id: "bitacora", titulo: "Bitácora", icono: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" }] },
];

function fechaDe(iso) {
  return new Date(iso).toLocaleString("es-GT", { dateStyle: "short", timeStyle: "short" });
}

function Icono({ d }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AdminPage() {
  const { sesion, salir } = useSesion();
  const navigate = useNavigate();
  const dialogo = useRef(null);
  const [corte, setCorte] = useState("resumen");
  const [plegada, setPlegada] = useState(() => localStorage.getItem("dpir.consola.plegada") === "1");
  const [menu, setMenu] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [rolFiltro, setRolFiltro] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState({ nombre: "", correo: "", clave: "", rol: "trabajador" });
  const [errores, setErrores] = useState({});
  const [version, setVersion] = useState(0);
  const refrescar = () => setVersion((valor) => valor + 1);

  const cuentas = useMemo(() => cuentasDisponibles(), [version]);
  const apagadas = useMemo(() => modalidadesApagadas(), [version]);
  const bitacora = useMemo(() => leerBitacora(), [version]);
  const texto = busqueda.trim().toLowerCase();
  const titulo = NAV.flatMap((grupo) => grupo.items).find((item) => item.id === corte)?.titulo || "Resumen";
  const enRevision = (item) => item.rol === "solicitante" && item.perfil?.estadoRevision === "pendiente";

  const resumen = {
    activos: cuentas.filter((item) => item.estado !== "suspendido" && !estaBloqueada(item.correo)).length,
    pendientes: cuentas.filter(enRevision).length,
    modalidades: TIPOS_MODALIDAD.length - apagadas.size,
    bitacora: bitacora.length,
  };
  const CIRC = 452.39;
  const TINTES = {
    admin: { clase: "dona-admin", sw: "sw-profundo" },
    solicitante: { clase: "dona-b", sw: "sw-naranja" },
    trabajador: { clase: "dona-a", sw: "sw-azul" },
    proveedor: { clase: "dona-c", sw: "sw-lima" },
  };
  const distribucion = ["admin", "trabajador", "proveedor", "solicitante"].map((id) => ({
    id,
    n: cuentas.filter((item) => item.roles.includes(id) && item.estado !== "suspendido" && !estaBloqueada(item.correo)).length,
    ...TINTES[id],
  }));
  const sumaAccesos = distribucion.reduce((total, item) => total + item.n, 0);
  let cursor = 0;
  const segmentos = sumaAccesos
    ? distribucion.filter((item) => item.n).map((item) => {
        const largo = (item.n / sumaAccesos) * CIRC;
        const segmento = { ...item, largo, offset: cursor, pct: Math.round((item.n / sumaAccesos) * 100) };
        cursor += largo;
        return segmento;
      })
    : [];

  useEffect(() => { setPagina(1); }, [corte, busqueda, estadoFiltro, rolFiltro]);

  function ir(id) {
    setCorte(id);
    setBusqueda("");
    setMenu(false);
  }

  function cambiar(evento) {
    const { name, value } = evento.target;
    setDatos((prev) => ({ ...prev, [name]: value }));
    setErrores((prev) => ({ ...prev, [name]: "" }));
  }

  function crear(evento) {
    evento.preventDefault();
    const fallos = {};
    if (datos.nombre.trim().length < 3) fallos.nombre = "Escribe el nombre de la persona o de la entidad.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo.trim())) fallos.correo = "Escribe un correo válido.";
    if (cuentas.some((item) => item.correo.toLowerCase() === datos.correo.trim().toLowerCase())) {
      fallos.correo = "Ese correo ya tiene una cuenta.";
    }
    if (datos.clave.length < 8) fallos.clave = "La contraseña necesita al menos 8 caracteres.";
    setErrores(fallos);
    if (Object.keys(fallos).length) return;
    const cuenta = {
      id: `u-${Date.now()}`,
      nombre: datos.nombre.trim(),
      correo: datos.correo.trim(),
      roles: [datos.rol],
      rol: datos.rol,
      clave: datos.clave,
      estado: "activo",
      proveedorId: datos.rol === "proveedor" ? `prov-${Date.now()}` : null,
      perfil: datos.rol === "solicitante"
        ? { institucion: datos.nombre.trim(), cargo: "", estadoRevision: "aprobado" }
        : null,
    };
    guardarCuenta(cuenta);
    anotar({
      actor: sesion.nombre,
      accion: "Alta de usuario",
      recurso: "usuarios",
      recursoId: cuenta.id,
      metadatos: { nombre: cuenta.nombre, rol: ROLES[cuenta.rol].etiqueta },
    });
    setDatos({ nombre: "", correo: "", clave: "", rol: "trabajador" });
    dialogo.current?.close();
    setCorte("usuarios");
    refrescar();
  }

  function alternarAcceso(cuenta) {
    if (cuenta.correo === sesion.correo) return;
    const bloqueada = !estaBloqueada(cuenta.correo);
    fijarBloqueo(cuenta.correo, bloqueada);
    anotar({
      actor: sesion.nombre,
      accion: bloqueada ? "Acceso suspendido" : "Acceso restaurado",
      recurso: "usuarios",
      recursoId: cuenta.id,
      metadatos: { correo: cuenta.correo },
    });
    refrescar();
  }

  function aprobar(cuenta) {
    const perfil = { ...cuenta.perfil, estadoRevision: "aprobado" };
    if (!actualizarCuenta(cuenta.correo, { perfil })) return;
    anotar({
      actor: sesion.nombre,
      accion: "Solicitante aprobado",
      recurso: "perfiles_solicitantes",
      recursoId: cuenta.id,
      metadatos: { correo: cuenta.correo, institucion: perfil.institucion },
    });
    refrescar();
  }

  function alternarModalidad(modalidad) {
    const activa = apagadas.has(modalidad.id);
    fijarModalidad(modalidad.id, activa);
    anotar({
      actor: sesion.nombre,
      accion: activa ? "Modalidad activa" : "Modalidad inactiva",
      recurso: "tipos_modalidad",
      recursoId: modalidad.id,
      metadatos: { nombre: modalidad.nombre },
    });
    refrescar();
  }

  function plegar() {
    setPlegada((valor) => {
      localStorage.setItem("dpir.consola.plegada", valor ? "0" : "1");
      return !valor;
    });
  }

  const listaUsuarios = cuentas.filter((item) => {
    if (estadoFiltro === "activos" && (item.estado === "suspendido" || estaBloqueada(item.correo))) return false;
    if (estadoFiltro === "suspendidos" && item.estado !== "suspendido" && !estaBloqueada(item.correo)) return false;
    if (rolFiltro !== "todos" && !item.roles.includes(rolFiltro)) return false;
    return !texto || `${item.nombre} ${item.correo}`.toLowerCase().includes(texto);
  });
  const listaPendientes = cuentas.filter((item) => enRevision(item) && (!texto || `${item.nombre} ${item.correo} ${item.perfil?.institucion || ""}`.toLowerCase().includes(texto)));
  const listaModalidades = TIPOS_MODALIDAD.filter((item) => {
    if (estadoFiltro === "inactivas" && !apagadas.has(item.id)) return false;
    if (estadoFiltro === "activas" && apagadas.has(item.id)) return false;
    return !texto || item.nombre.toLowerCase().includes(texto);
  });
  const listaBitacora = bitacora.filter((item) => !texto || `${item.accion} ${item.actor} ${item.recurso} ${detalleDe(item)}`.toLowerCase().includes(texto));
  const fuente = corte === "usuarios" ? listaUsuarios : corte === "pendientes" ? listaPendientes : corte === "modalidades" ? listaModalidades : listaBitacora;
  const paginas = Math.max(1, Math.ceil(fuente.length / POR_PAGINA));
  const paginaSegura = Math.min(pagina, paginas);
  const filas = fuente.slice((paginaSegura - 1) * POR_PAGINA, paginaSegura * POR_PAGINA);

  return (
    <section className={`consola${plegada ? " es-plegada" : ""}${menu ? " es-abierta" : ""}`}>
      <button type="button" className="consola__velo" aria-label="Cerrar menú" onClick={() => setMenu(false)} />
      <aside className="consola__lado">
        <div className="consola__marca">
          <div>
            <strong>DPIR</strong>
            <small>Administración</small>
          </div>
          <button type="button" className="consola__plegar" aria-label={plegada ? "Expandir menú" : "Plegar menú"} onClick={plegar}>
            {plegada ? "›" : "‹"}
          </button>
        </div>
        {NAV.map((grupo) => (
          <div key={grupo.grupo}>
            <p className="consola__grupo">{grupo.grupo}</p>
            <nav className="consola__nav" aria-label={grupo.grupo}>
              {grupo.items.map((item) => (
                <button key={item.id} type="button" className={corte === item.id ? "es-activa" : ""} aria-current={corte === item.id ? "page" : undefined} onClick={() => ir(item.id)}>
                  <Icono d={item.icono} />
                  <span>{item.titulo}</span>
                  {item.id !== "resumen" ? <b>{item.id === "usuarios" ? resumen.activos : item.id === "modalidades" ? resumen.modalidades : resumen[item.id]}</b> : null}
                </button>
              ))}
            </nav>
          </div>
        ))}
        <div className="consola__pie">
          <span className="consola__avatar" aria-hidden="true">{inicialesDe(sesion.nombre)}</span>
          <div>
            <strong>{sesion.nombre}</strong>
            <small>{ROLES[sesion.rol].etiqueta}</small>
          </div>
          <Link to="/">Sitio público</Link>
          <button type="button" onClick={() => { salir(); navigate("/"); }}>Cerrar sesión</button>
        </div>
      </aside>

      <div className="consola__main">
        <header className="consola__top">
          <div className="consola__miga">
            <button type="button" className="consola__menu" aria-label="Abrir menú" onClick={() => setMenu(true)}>☰</button>
            <span>Administración</span>
            <span aria-hidden="true">/</span>
            <strong>{titulo}</strong>
          </div>
          <div className="consola__top-cuenta">
            <div>
              <strong>{sesion.nombre}</strong>
              <small style={{ display: "block", color: "var(--muted)", fontSize: "0.75rem" }}>{ROLES[sesion.rol].etiqueta}</small>
            </div>
            <span aria-hidden="true">{inicialesDe(sesion.nombre)}</span>
          </div>
        </header>

        <div className="consola__contenido">
          {corte === "resumen" ? (
            <>
              <div className="consola__kpis">
                <article className="consola__kpi consola__kpi--azul">
                  <span>Con acceso</span><strong>{resumen.activos}</strong><small>Cuentas activas del portal</small>
                  <div className="consola__pista" aria-hidden="true"><i style={{ "--p": resumen.activos ? "100%" : "0%" }} /></div>
                </article>
                <article className="consola__kpi consola__kpi--naranja">
                  <span>En revisión</span><strong>{resumen.pendientes}</strong><small>Solicitantes pendientes de aprobar</small>
                  <div className="consola__pista" aria-hidden="true"><i style={{ "--p": resumen.pendientes ? "100%" : "0%" }} /></div>
                </article>
                <article className="consola__kpi consola__kpi--lima">
                  <span>Modalidades</span><strong>{resumen.modalidades}</strong><small>Activas de {TIPOS_MODALIDAD.length}</small>
                  <div className="consola__pista" aria-hidden="true"><i style={{ "--p": `${Math.round((resumen.modalidades / TIPOS_MODALIDAD.length) * 100)}%` }} /></div>
                </article>
                <article className="consola__kpi consola__kpi--profundo">
                  <span>Bitácora</span><strong>{resumen.bitacora}</strong><small>Movimientos registrados</small>
                  <div className="consola__pista" aria-hidden="true"><i style={{ "--p": resumen.bitacora ? "100%" : "0%" }} /></div>
                </article>
              </div>
              <div className="consola__dos">
                <section className="consola__tarjeta">
                    <header>
                      <div>
                        <h2>Distribución</h2>
                        <p>Cuentas activas por acceso.</p>
                      </div>
                    </header>
                    <div className="dona-wrap consola__dona">
                      <svg className="dona" viewBox="0 0 200 200" aria-hidden="true">
                        <circle className="dona-fondo" cx="100" cy="100" r="72" />
                        {segmentos.map((item) => (
                          <circle
                            key={item.id}
                            className={item.clase}
                            cx="100"
                            cy="100"
                            r="72"
                            style={{ strokeDasharray: `${item.largo} ${CIRC}`, strokeDashoffset: -item.offset }}
                          />
                        ))}
                        <text x="100" y="96" className="dona-num">{sumaAccesos}</text>
                        <text x="100" y="116" className="dona-sub">activas</text>
                      </svg>
                      <ul className="leyenda">
                        {distribucion.map((item) => (
                          <li key={item.id}>
                            <i className={`sw ${item.sw}`} />
                            <span>{ROLES[item.id].etiqueta}</span>
                            <b>{item.n}</b>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>
                  <section className="consola__espera">
                    <strong>{resumen.pendientes}</strong>
                    <div>
                      <span>En revisión</span>
                      <p>{resumen.pendientes ? "Estos solicitantes esperan aprobación." : "Nadie está en revisión. Un registro nuevo aparece aquí."}</p>
                      {resumen.pendientes ? <button type="button" className="btn btn--naranja" onClick={() => ir("pendientes")}>Revisar perfiles</button> : null}
                    </div>
                  </section>
              </div>
              <section className="consola__tarjeta">
                <header>
                  <div>
                    <h2>Cuentas recientes</h2>
                    <p>Las últimas que están en el portal.</p>
                  </div>
                  <button type="button" className="btn btn--linea" onClick={() => ir("usuarios")}>Ver todas</button>
                </header>
                <TablaUsuarios filas={cuentas.slice(0, 5)} sesion={sesion} onAcceso={alternarAcceso} />
              </section>
              <section className="consola__tarjeta">
                <header>
                  <div>
                    <h2>Últimos movimientos</h2>
                    <p>La bitácora solo se consulta.</p>
                  </div>
                  <button type="button" className="btn btn--linea" onClick={() => ir("bitacora")}>Ver bitácora</button>
                </header>
                <TablaBitacora filas={bitacora.slice(0, 5)} />
              </section>
            </>
          ) : (
            <section className="consola__tarjeta">
              <header className="consola__pagina">
                <div>
                  <h1>{titulo}</h1>
                  <p>
                    {corte === "usuarios" && "Altas, suspensiones y restauraciones de las cuentas internas."}
                    {corte === "pendientes" && "Solicitantes cuya institución aún no está aprobada."}
                    {corte === "modalidades" && "Tipos de compra del portal. Inactivar una modalidad la deja fuera de las solicitudes nuevas."}
                    {corte === "bitacora" && "Cada cambio queda aquí. Esta lista no se edita ni se borra."}
                  </p>
                </div>
                {corte === "usuarios" ? (
                  <button type="button" className="btn btn--naranja" onClick={() => dialogo.current?.showModal()}>Nuevo usuario</button>
                ) : null}
              </header>
              <div className="consola__barra" style={{ padding: "0 16px 12px" }}>
                <input
                  type="search"
                  value={busqueda}
                  onChange={(evento) => setBusqueda(evento.target.value)}
                  placeholder={corte === "modalidades" ? "Buscar modalidad" : corte === "bitacora" ? "Buscar acción, actor o recurso" : "Buscar nombre o correo"}
                  aria-label="Buscar"
                />
                {corte === "usuarios" ? (
                  <>
                    <select value={estadoFiltro} onChange={(evento) => setEstadoFiltro(evento.target.value)} aria-label="Estado">
                      <option value="todos">Todos los estados</option>
                      <option value="activos">Activas</option>
                      <option value="suspendidos">Suspendidas</option>
                    </select>
                    <select value={rolFiltro} onChange={(evento) => setRolFiltro(evento.target.value)} aria-label="Acceso">
                      <option value="todos">Todos los accesos</option>
                      {ROLES_FILTRO.map((id) => <option key={id} value={id}>{ROLES[id].etiqueta}</option>)}
                    </select>
                  </>
                ) : null}
                {corte === "modalidades" ? (
                  <select value={estadoFiltro} onChange={(evento) => setEstadoFiltro(evento.target.value)} aria-label="Uso">
                    <option value="todos">Todas</option>
                    <option value="activas">Activas</option>
                    <option value="inactivas">Inactivas</option>
                  </select>
                ) : null}
              </div>
              {corte === "usuarios" ? <TablaUsuarios filas={filas} sesion={sesion} onAcceso={alternarAcceso} /> : null}
              {corte === "pendientes" ? <TablaPendientes filas={filas} onAprobar={aprobar} /> : null}
              {corte === "modalidades" ? <TablaModalidades filas={filas} apagadas={apagadas} onCambiar={alternarModalidad} /> : null}
              {corte === "bitacora" ? <TablaBitacora filas={filas} /> : null}
              <footer className="consola__pager">
                <span>{fuente.length} registro{fuente.length === 1 ? "" : "s"}</span>
                <div>
                  <button type="button" className="btn btn--linea" disabled={paginaSegura <= 1} onClick={() => setPagina((valor) => valor - 1)}>Anterior</button>
                  <button type="button" className="btn btn--linea" disabled={paginaSegura >= paginas} onClick={() => setPagina((valor) => valor + 1)}>Siguiente</button>
                </div>
              </footer>
            </section>
          )}
        </div>
      </div>

      <dialog className="consola__dialog" ref={dialogo} onClose={() => setErrores({})}>
        <form onSubmit={crear}>
          <h2>Nuevo usuario</h2>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            {datos.rol === "proveedor"
              ? "Se crea la persona y el proveedor ligado a esta cuenta, con la contraseña temporal."
              : "La cuenta de trabajador entra activa con la contraseña temporal que se escribe aquí."}
          </p>
          <label>Nombre<input name="nombre" value={datos.nombre} onChange={cambiar} aria-invalid={Boolean(errores.nombre)} />{errores.nombre ? <span className="formulario__error">{errores.nombre}</span> : null}</label>
          <label>Correo<input name="correo" type="email" value={datos.correo} onChange={cambiar} aria-invalid={Boolean(errores.correo)} />{errores.correo ? <span className="formulario__error">{errores.correo}</span> : null}</label>
          <label>Contraseña temporal<input name="clave" type="text" autoComplete="off" value={datos.clave} onChange={cambiar} aria-invalid={Boolean(errores.clave)} />{errores.clave ? <span className="formulario__error">{errores.clave}</span> : null}</label>
          <label>Acceso
            <select name="rol" value={datos.rol} onChange={cambiar}>
              {ROLES_ALTA.map((id) => <option key={id} value={id}>{ROLES[id].etiqueta}</option>)}
            </select>
          </label>
          <div className="consola__barra">
            <button type="submit" className="btn btn--naranja">Crear cuenta</button>
            <button type="button" className="btn btn--linea" onClick={() => dialogo.current?.close()}>Cancelar</button>
          </div>
        </form>
      </dialog>
    </section>
  );
}

function TablaUsuarios({ filas, sesion, onAcceso }) {
  if (!filas.length) return <p className="consola__vacio">No hay cuentas con esos filtros.</p>;
  return (
    <div className="tabla-wrap">
      <table className="tabla tabla--densa">
        <thead>
          <tr><th>Nombre</th><th>Correo</th><th>Acceso</th><th>Estado</th><th>Acción</th></tr>
        </thead>
        <tbody>
          {filas.map((cuenta) => {
            const propia = cuenta.correo === sesion.correo;
            const base = CUENTAS.some((item) => item.correo === cuenta.correo);
            const bloqueada = cuenta.estado === "suspendido" || estaBloqueada(cuenta.correo);
            return (
              <tr key={cuenta.correo}>
                <td className="tabla__producto">{cuenta.nombre}</td>
                <td>{cuenta.correo}</td>
                <td>{cuenta.roles.map((id) => <span key={id} className={`chip chip--${id}`}>{ROLES[id]?.etiqueta}</span>)}</td>
                <td><span className={`chip ${bloqueada ? "chip--aviso" : "chip--ok"}`}>{bloqueada ? "Suspendida" : "Activa"}</span></td>
                <td className="tabla__accion">
                  <button type="button" className="btn btn--linea" disabled={propia || (base && cuenta.rol === "admin")} onClick={() => onAcceso(cuenta)}>
                    {propia ? "Sesión actual" : bloqueada ? "Restaurar" : "Suspender"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TablaPendientes({ filas, onAprobar }) {
  if (!filas.length) return <p className="consola__vacio">No hay solicitantes en revisión.</p>;
  return (
    <div className="tabla-wrap">
      <table className="tabla tabla--densa">
        <thead><tr><th>Nombre</th><th>Correo</th><th>Institución</th><th>Cargo</th><th>Acción</th></tr></thead>
        <tbody>
          {filas.map((cuenta) => (
            <tr key={cuenta.correo}>
              <td className="tabla__producto">{cuenta.nombre}</td>
              <td>{cuenta.correo}</td>
              <td>{cuenta.perfil?.institucion || "—"}</td>
              <td>{cuenta.perfil?.cargo || "—"}</td>
              <td className="tabla__accion">
                <button type="button" className="btn btn--naranja" onClick={() => onAprobar(cuenta)}>Aprobar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TablaModalidades({ filas, apagadas, onCambiar }) {
  if (!filas.length) return <p className="consola__vacio">Ninguna modalidad coincide con la búsqueda.</p>;
  return (
    <div className="tabla-wrap">
      <table className="tabla tabla--densa">
        <thead><tr><th>Modalidad</th><th>Código</th><th>Uso</th><th>Acción</th></tr></thead>
        <tbody>
          {filas.map((modalidad) => {
            const apagada = apagadas.has(modalidad.id);
            return (
              <tr key={modalidad.id}>
                <td className="tabla__producto">{modalidad.nombre}</td>
                <td>{modalidad.codigo}</td>
                <td><span className={`chip ${apagada ? "chip--neutro" : "chip--ok"}`}>{apagada ? "Inactiva" : "Activa"}</span></td>
                <td className="tabla__accion">
                  <button type="button" className="btn btn--linea" onClick={() => onCambiar(modalidad)}>{apagada ? "Activar" : "Inactivar"}</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TablaBitacora({ filas }) {
  if (!filas.length) return <p className="consola__vacio">Aún no hay movimientos. Cada alta, cambio de acceso o modalidad queda aquí.</p>;
  return (
    <div className="tabla-wrap">
      <table className="tabla tabla--densa">
        <thead><tr><th>Fecha</th><th>Actor</th><th>Acción</th><th>Recurso</th><th>Detalle</th></tr></thead>
        <tbody>
          {filas.map((item) => (
            <tr key={`${item.creadoEn}-${item.accion}-${item.recursoId || ""}`}>
              <td>{fechaDe(item.creadoEn)}</td>
              <td>{item.actor}</td>
              <td>{item.accion}</td>
              <td>{item.recurso}</td>
              <td>{detalleDe(item)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

