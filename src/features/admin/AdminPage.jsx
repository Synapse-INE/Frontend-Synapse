import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, solicitar } from "../../servicios/api";
import { ROLES, inicialesDe } from "../../sesion/roles";
import { useSesion } from "../../sesion/Sesion";
import {
  ESTADO_CUENTA,
  FILTROS_ESTADO,
  FILTROS_ROL,
  ROL_API,
  accionLegible,
  recursoLegible,
  tonoAccion,
} from "./adminEtiquetas";
import { PendientesReales } from "./PendientesReales";
import "./adminConsola.css";
import { runTourAdmin, useTourAdmin } from "../../tours/tourAdmin";

const NAV = [
  { grupo: "Gestión", items: [{ id: "resumen", titulo: "Resumen", icono: "M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z", clave: "resumen" }] },
  {
    grupo: "Cuentas",
    items: [
      { id: "pendientes", titulo: "En revisión", icono: "M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0", clave: "pendientes" },
      { id: "usuarios", titulo: "Usuarios", icono: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75", clave: "usuariosActivos" },
      { id: "invitaciones", titulo: "Invitaciones", icono: "M4 4h16v16H4zM4 8h16M8 4v4", clave: null },
    ],
  },
  { grupo: "Catálogo", items: [{ id: "modalidades", titulo: "Modalidades", icono: "M4 7h16M4 12h16M4 17h10", clave: "modalidadesActivas" }] },
  { grupo: "Control", items: [{ id: "bitacora", titulo: "Bitácora", icono: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01", clave: "auditoriaTotal" }] },
];

const DESCRIPCION = {
  resumen: "Indicadores reales del portal.",
  pendientes: "Solicitantes con correo verificado que esperan tu decisión.",
  usuarios: "Cuentas registradas en la base de datos, con su estado actual.",
  invitaciones: "Envía acceso a proveedores mediante invitación por correo.",
  modalidades: "Tipos de compra publicados en el catálogo.",
  bitacora: "Eventos auditados del servidor; solo lectura.",
};

function fechaCorta(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-GT", { dateStyle: "short", timeStyle: "short" });
}

function Icono({ d }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Pager({ pagina, paginas, total, etiqueta, cambiar }) {
  return (
    <footer className="consola__pager">
      <span>{total} {etiqueta}{total === 1 ? "" : "s"} · pág. {pagina} de {paginas}</span>
      <div>
        <button type="button" className="btn btn--linea btn--sm" disabled={pagina <= 1} onClick={() => cambiar(pagina - 1)}>Anterior</button>
        <button type="button" className="btn btn--linea btn--sm" disabled={pagina >= paginas} onClick={() => cambiar(pagina + 1)}>Siguiente</button>
      </div>
    </footer>
  );
}

export function AdminPage() {
  const { sesion, salir } = useSesion();
  const navigate = useNavigate();
  const [corte, setCorte] = useState("resumen");
  const [plegada, setPlegada] = useState(() => localStorage.getItem("dpir.consola.plegada") === "1");
  const [menu, setMenu] = useState(false);
  const [resumen, setResumen] = useState(null);
  const [version, setVersion] = useState(0);
  const refrescar = useCallback(() => setVersion((v) => v + 1), []);
  useTourAdmin();

  useEffect(() => {
    if (sesion?.rol !== "admin") return undefined;
    let viva = true;
    solicitar("/administracion/resumen")
      .then((datos) => { if (viva) setResumen(datos); })
      .catch(() => { if (viva) setResumen(null); });
    return () => { viva = false; };
  }, [sesion, version]);

  const titulo = NAV.flatMap((g) => g.items).find((i) => i.id === corte)?.titulo || "Resumen";
  const indicador = (clave) => (clave && resumen ? resumen[clave] ?? 0 : null);

  function ir(id) {
    setCorte(id);
    setMenu(false);
  }

  function plegar() {
    setPlegada((valor) => {
      localStorage.setItem("dpir.consola.plegada", valor ? "0" : "1");
      return !valor;
    });
  }

  return (
    <section className={`consola consola--admin${plegada ? " es-plegada" : ""}${menu ? " es-abierta" : ""}`}>
      <button type="button" className="consola__velo" aria-label="Cerrar menú" onClick={() => setMenu(false)} />
      <aside className="consola__lado" id="admin-nav">
        <div className="consola__marca">
          <div><strong>DPIR</strong><small>Administración</small></div>
          <button type="button" className="consola__plegar" aria-label={plegada ? "Expandir menú" : "Plegar menú"} onClick={plegar}>{plegada ? "›" : "‹"}</button>
        </div>
        {NAV.map((grupo) => (
          <div key={grupo.grupo}>
            <p className="consola__grupo">{grupo.grupo}</p>
            <nav className="consola__nav" aria-label={grupo.grupo}>
              {grupo.items.map((item) => (
                <button key={item.id} type="button" className={corte === item.id ? "es-activa" : ""} aria-current={corte === item.id ? "page" : undefined} onClick={() => ir(item.id)}>
                  <Icono d={item.icono} />
                  <span>{item.titulo}</span>
                  {item.id !== "resumen" && item.clave ? <b>{indicador(item.clave) ?? "…"}</b> : null}
                </button>
              ))}
            </nav>
          </div>
        ))}
        <div className="consola__pie consola__pie--admin">
          <span className="consola__avatar" aria-hidden="true">{inicialesDe(sesion.nombre)}</span>
          <div className="consola__pie-cuenta">
            <strong>{sesion.nombre}</strong>
            <small>{ROLES.admin.etiqueta}</small>
          </div>
          <div className="consola__pie-acciones">
            <Link to="/" className="consola__pie-enlace">
              <Icono d="M4 11h5l2-7h7v16H4zM9 11V4" />
              <span>Sitio público</span>
            </Link>
            <button type="button" className="consola__pie-salir" onClick={() => { salir(); navigate("/"); }}>
              <Icono d="M9 21H5a2 2 0 0 1-2-2V5M16 17l5-5-5-5M21 12H9" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="consola__main">
        <header className="consola__top">
          <div className="consola__miga">
            <button type="button" className="consola__menu" aria-label="Abrir menú" onClick={() => setMenu(true)}>☰</button>
            <span>Administración</span><span aria-hidden="true">/</span><strong>{titulo}</strong>
          </div>
          <div className="consola__top-cuenta">
            <span aria-hidden="true">{inicialesDe(sesion.nombre)}</span>
          </div>
        </header>

        <div className="consola__contenido">
          <div key={corte} className="consola__escena">
            {corte !== "resumen" ? (
              <header className="consola__pagina consola__pagina--compacta consola__escena-cabecera">
                <div>
                  <p className="consola__ceja">Administración</p>
                  <h1>{titulo}</h1>
                  <p>{DESCRIPCION[corte]}</p>
                </div>
              </header>
            ) : null}

            {corte === "resumen" ? <ResumenAdmin resumen={resumen} ir={ir} refrescar={refrescar} version={version} /> : null}
            {corte === "pendientes" ? (
              <section className="consola__panel consola__escena-panel">
                <PendientesReales onCambio={refrescar} />
              </section>
            ) : null}
            {corte === "usuarios" ? <UsuariosAdmin version={version} /> : null}
            {corte === "modalidades" ? <ModalidadesAdmin version={version} onCambio={refrescar} /> : null}
            {corte === "bitacora" ? <BitacoraAdmin version={version} /> : null}
            {corte === "invitaciones" ? <InvitacionesAdmin /> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function ResumenAdmin({ resumen, ir, version }) {
  const [usuarios, setUsuarios] = useState([]);
  const [eventos, setEventos] = useState([]);

  useEffect(() => {
    let viva = true;
    Promise.all([
      solicitar("/administracion/usuarios?limite=5"),
      solicitar("/administracion/auditoria?limite=5"),
    ])
      .then(([lista, bitacora]) => {
        if (!viva) return;
        setUsuarios(lista.usuarios || []);
        setEventos(bitacora.eventos || []);
      })
      .catch(() => {
        if (viva) {
          setUsuarios([]);
          setEventos([]);
        }
      });
    return () => { viva = false; };
  }, [version]);

  if (!resumen) return <p className="consola__vacio">Cargando el resumen…</p>;

  const accesos = Object.entries(resumen.accesos || {});
  const maxAcceso = Math.max(1, ...accesos.map(([, n]) => n));

  return (
    <>
      <header className="consola__pagina consola__pagina--compacta consola__escena-cabecera" id="admin-intro">
        <div className="consola__titulo-fila">
          <div>
            <p className="consola__ceja">Administración</p>
            <h1>Resumen</h1>
            <p>Indicadores reales del portal.</p>
          </div>
          <button type="button" className="mesa-tutorial" id="admin-tutorial" onClick={() => runTourAdmin()}>
            Tutorial
          </button>
        </div>
      </header>
      <div className="consola__kpis consola__kpis--compactos consola__kpis--entrada" id="admin-kpis">
        <article id="admin-kpi-revision" className={`consola__kpi consola__kpi--revision${resumen.pendientes ? " tiene-pendientes" : ""}`}>
          <span>En revisión</span>
          <strong>{resumen.pendientes}</strong>
          {resumen.pendientes ? (
            <button type="button" className="btn btn--naranja btn--sm consola__kpi-btn" onClick={() => ir("pendientes")}>
              Revisar solicitudes
            </button>
          ) : (
            <small className="consola__kpi-nota">Nadie espera aprobación</small>
          )}
        </article>
        <article className="consola__kpi"><span>Cuentas activas</span><strong>{resumen.usuariosActivos}</strong></article>
        <article className="consola__kpi"><span>Modalidades</span><strong>{resumen.modalidadesActivas}/{resumen.modalidadesTotal}</strong></article>
        <article className="consola__kpi"><span>Eventos</span><strong>{resumen.auditoriaTotal}</strong></article>
      </div>
      <section id="admin-accesos" className="consola__panel consola__panel--compacto consola__escena-panel">
        <header className="consola__panel-top"><h2>Accesos activos</h2></header>
        <ul className="consola__barras">
          {accesos.map(([codigo, total]) => (
            <li key={codigo}>
              <span>{ROL_API[codigo] || codigo}</span>
              <i><b style={{ width: `${(total / maxAcceso) * 100}%` }} /></i>
              <b>{total}</b>
            </li>
          ))}
        </ul>
      </section>
      <div className="consola__fila" id="admin-recientes">
        <section className="consola__panel consola__panel--compacto consola__escena-panel consola__escena-panel--2">
          <header className="consola__panel-top">
            <h2>Últimas cuentas</h2>
            <button type="button" className="btn btn--linea btn--sm" onClick={() => ir("usuarios")}>Ver todas</button>
          </header>
          <TablaUsuarios filas={usuarios} compacta />
        </section>
        <section className="consola__panel consola__panel--compacto consola__escena-panel consola__escena-panel--3">
          <header className="consola__panel-top">
            <h2>Últimos eventos</h2>
            <button type="button" className="btn btn--linea btn--sm" onClick={() => ir("bitacora")}>Ver bitácora</button>
          </header>
          <TablaBitacora filas={eventos} compacta />
        </section>
      </div>
    </>
  );
}

function TablaUsuarios({ filas, compacta }) {
  if (!filas.length) return <p className="consola__vacio consola__vacio--chico">No hay cuentas para mostrar.</p>;
  return (
    <div className="tabla-wrap tabla-wrap--plana">
      <table className={`tabla tabla--densa tabla--admin${compacta ? " tabla--mini" : ""}`}>
        <thead><tr><th>Cuenta</th><th>Acceso</th><th>Estado</th>{compacta ? null : <th>Último ingreso</th>}</tr></thead>
        <tbody>
          {filas.map((cuenta) => (
            <tr key={cuenta.id}>
              <td>
                <div className="persona persona--sm">
                  <span className="persona__avatar" aria-hidden="true">{inicialesDe(cuenta.nombre)}</span>
                  <div><strong>{cuenta.nombre}</strong><small>{cuenta.email}</small></div>
                </div>
              </td>
              <td>{cuenta.roles.map((rol) => <span key={rol} className="chip chip--mini">{ROL_API[rol] || rol}</span>)}</td>
              <td><span className="chip chip--mini chip--neutro">{ESTADO_CUENTA[cuenta.estado] || cuenta.estado}</span></td>
              {compacta ? null : <td className="consola__fecha">{fechaCorta(cuenta.ultimoAccesoEn)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TablaBitacora({ filas, compacta }) {
  if (!filas.length) return <p className="consola__vacio consola__vacio--chico">Aún no hay eventos auditados.</p>;
  return (
    <div className="tabla-wrap tabla-wrap--plana">
      <table className={`tabla tabla--densa tabla--admin${compacta ? " tabla--mini" : ""}`}>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Actor</th>
            <th>Acción</th>
            {compacta ? null : <th>Recurso</th>}
          </tr>
        </thead>
        <tbody>
          {filas.map((item) => (
            <tr key={item.id}>
              <td className="consola__fecha">{fechaCorta(item.creadoEn)}</td>
              <td>
                <strong className="celda-titulo">{item.actor}</strong>
                {item.actorCorreo ? <span className="celda-sec">{item.actorCorreo}</span> : null}
              </td>
              <td>
                <span className={`chip chip--mini chip--${tonoAccion(item.accion)}`} title={item.accion}>
                  {accionLegible(item.accion)}
                </span>
              </td>
              {compacta ? null : (
                <td>
                  <span className="celda-recurso">{recursoLegible(item.recurso)}</span>
                  {item.recursoId ? <span className="celda-sec">{item.recursoId}</span> : null}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UsuariosAdmin({ version }) {
  const [busqueda, setBusqueda] = useState("");
  const [rol, setRol] = useState("");
  const [estado, setEstado] = useState("");
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => { setPagina(1); }, [busqueda, rol, estado]);

  useEffect(() => {
    let viva = true;
    setCargando(true);
    const params = new URLSearchParams({ pagina: String(pagina), limite: "10" });
    if (busqueda.trim()) params.set("texto", busqueda.trim());
    if (rol) params.set("rol", rol);
    if (estado) params.set("estado", estado);
    solicitar(`/administracion/usuarios?${params}`)
      .then((lista) => { if (viva) setDatos(lista); })
      .catch((fallo) => {
        if (viva) setError(fallo instanceof ApiError ? fallo.detail : "No se pudo leer las cuentas.");
      })
      .finally(() => { if (viva) setCargando(false); });
    return () => { viva = false; };
  }, [busqueda, rol, estado, pagina, version]);

  return (
    <section className="consola__panel consola__escena-panel">
      <div className="consola__barra consola__barra--compacta">
        <label className="consola__buscar">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar nombre o correo" aria-label="Buscar" />
        </label>
        <select value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Estado">
          {FILTROS_ESTADO.map((item) => <option key={item.valor || "t"} value={item.valor}>{item.etiqueta}</option>)}
        </select>
        <select value={rol} onChange={(e) => setRol(e.target.value)} aria-label="Acceso">
          {FILTROS_ROL.map((item) => <option key={item.valor || "t"} value={item.valor}>{item.etiqueta}</option>)}
        </select>
      </div>
      {error ? <p className="consola__alerta" role="alert">{error}</p> : null}
      {cargando ? <p className="consola__vacio consola__vacio--chico">Leyendo cuentas…</p> : <TablaUsuarios filas={datos?.usuarios || []} />}
      {!cargando && datos ? (
        <Pager pagina={datos.pagina} paginas={datos.paginas} total={datos.total} etiqueta="registro" cambiar={setPagina} />
      ) : null}
    </section>
  );
}

function ModalidadesAdmin({ version, onCambio }) {
  const [filas, setFilas] = useState([]);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState("");

  useEffect(() => {
    let viva = true;
    solicitar("/administracion/modalidades")
      .then((datos) => { if (viva) setFilas(datos.modalidades || []); })
      .catch((fallo) => {
        if (viva) setError(fallo instanceof ApiError ? fallo.detail : "No se pudieron leer las modalidades.");
      });
    return () => { viva = false; };
  }, [version]);

  async function alternar(modalidad) {
    setOcupado(modalidad.id);
    setError("");
    try {
      await solicitar(`/administracion/modalidades/${modalidad.id}`, {
        method: "PATCH",
        cuerpo: { activo: !modalidad.activo },
      });
      const datos = await solicitar("/administracion/modalidades");
      setFilas(datos.modalidades || []);
      onCambio?.();
    } catch (fallo) {
      setError(fallo instanceof ApiError ? fallo.detail : "No se pudo cambiar la modalidad.");
    } finally {
      setOcupado("");
    }
  }

  return (
    <section className="consola__panel consola__escena-panel">
      {error ? <p className="consola__alerta" role="alert">{error}</p> : null}
      <div className="tabla-wrap tabla-wrap--plana">
        <table className="tabla tabla--densa tabla--admin tabla--mini">
          <thead><tr><th>Modalidad</th><th>Código</th><th>Uso</th><th>Acción</th></tr></thead>
          <tbody>
            {filas.map((modalidad) => (
              <tr key={modalidad.id}>
                <td><strong>{modalidad.nombre}</strong></td>
                <td className="dato-sec">{modalidad.codigo}</td>
                <td><span className={`chip chip--mini ${modalidad.activo ? "chip--ok" : "chip--neutro"}`}>{modalidad.activo ? "Activa" : "Inactiva"}</span></td>
                <td>
                  <button type="button" className="btn btn--linea btn--sm" disabled={ocupado === modalidad.id} onClick={() => alternar(modalidad)}>
                    {modalidad.activo ? "Inactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BitacoraAdmin({ version }) {
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => { setPagina(1); }, [busqueda]);

  useEffect(() => {
    let viva = true;
    setCargando(true);
    const params = new URLSearchParams({ pagina: String(pagina), limite: "10" });
    if (busqueda.trim()) params.set("texto", busqueda.trim());
    solicitar(`/administracion/auditoria?${params}`)
      .then((lista) => { if (viva) setDatos(lista); })
      .catch((fallo) => {
        if (viva) setError(fallo instanceof ApiError ? fallo.detail : "No se pudo leer la bitácora.");
      })
      .finally(() => { if (viva) setCargando(false); });
    return () => { viva = false; };
  }, [busqueda, pagina, version]);

  return (
    <section className="consola__panel consola__escena-panel">
      <div className="consola__barra consola__barra--compacta">
        <label className="consola__buscar">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar acción, actor o recurso" aria-label="Buscar" />
        </label>
      </div>
      {error ? <p className="consola__alerta" role="alert">{error}</p> : null}
      {cargando ? <p className="consola__vacio consola__vacio--chico">Leyendo eventos…</p> : <TablaBitacora filas={datos?.eventos || []} />}
      {!cargando && datos ? (
        <Pager pagina={datos.pagina} paginas={datos.paginas} total={datos.total} etiqueta="evento" cambiar={setPagina} />
      ) : null}
    </section>
  );
}

function InvitacionesAdmin() {
  const [proveedores, setProveedores] = useState([]);
  const [modo, setModo] = useState("nuevo");
  const [correo, setCorreo] = useState("");
  const [nombre, setNombre] = useState("");
  const [proveedorId, setProveedorId] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    solicitar("/administracion/proveedores")
      .then((datos) => setProveedores(datos.proveedores || []))
      .catch(() => setProveedores([]));
  }, []);

  async function enviar(evento) {
    evento.preventDefault();
    setError("");
    setMensaje("");
    setEnviando(true);
    try {
      const cuerpo = { email: correo.trim() };
      if (modo === "existente") cuerpo.proveedorId = proveedorId;
      else cuerpo.nuevoProveedor = { nombreComercial: nombre.trim() };
      const resultado = await solicitar("/invitaciones", { method: "POST", cuerpo });
      setMensaje(
        resultado.correoEnviado
          ? `Invitación enviada a ${resultado.email}. Vence ${fechaCorta(resultado.venceEn)}.`
          : `Invitación creada para ${resultado.email}, pero el correo no se pudo enviar. Revisa SMTP.`,
      );
      setCorreo("");
      setNombre("");
      setProveedorId("");
    } catch (fallo) {
      setError(fallo instanceof ApiError ? fallo.detail : "No se pudo crear la invitación.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="consola__panel consola__escena-panel">
      <div className="consola__invitacion">
        <form className="consola__formulario" onSubmit={enviar}>
          <header className="consola__formulario-top">
            <h2>Nueva invitación</h2>
            <p>El proveedor recibe un enlace por correo para crear su acceso al portal.</p>
          </header>
          <label>
            Correo del proveedor
            <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required placeholder="contacto@empresa.gt" />
          </label>
          <fieldset className="consola__modo">
            <legend>Tipo de invitación</legend>
            <label className="consola__opcion">
              <input type="radio" name="modo-inv" value="nuevo" checked={modo === "nuevo"} onChange={() => setModo("nuevo")} />
              <span><strong>Empresa nueva</strong><small>Se crea el proveedor y se envía el enlace.</small></span>
            </label>
            <label className="consola__opcion">
              <input type="radio" name="modo-inv" value="existente" checked={modo === "existente"} onChange={() => setModo("existente")} />
              <span><strong>Proveedor registrado</strong><small>Vincula la invitación a un proveedor ya guardado.</small></span>
            </label>
          </fieldset>
          {modo === "nuevo" ? (
            <label>
              Nombre comercial
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} placeholder="Nombre de la empresa" />
            </label>
          ) : (
            <label>
              Proveedor
              <select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)} required>
                <option value="">{proveedores.length ? "Selecciona…" : "No hay proveedores activos"}</option>
                {proveedores.map((item) => <option key={item.id} value={item.id}>{item.nombreComercial}</option>)}
              </select>
            </label>
          )}
          {error ? <p className="consola__aviso consola__aviso--error" role="alert">{error}</p> : null}
          {mensaje ? <p className="consola__aviso consola__aviso--ok" role="status">{mensaje}</p> : null}
          <div className="consola__formulario-pie">
            <button type="submit" className="btn btn--naranja btn--sm" disabled={enviando}>{enviando ? "Enviando…" : "Enviar invitación"}</button>
          </div>
        </form>
        <aside className="consola__invitacion-ayuda" aria-label="Cómo funciona">
          <p className="consola__ceja">Guía</p>
          <h3>Qué hace esta invitación</h3>
          <ol>
            <li>Se registra la invitación en el servidor con una vigencia limitada.</li>
            <li>Si el correo está configurado, el proveedor recibe el enlace de acceso.</li>
            <li>Al aceptarla, queda una cuenta con rol de proveedor.</li>
          </ol>
          <p className="consola__nota">Las invitaciones anteriores al mismo correo quedan sin efecto cuando envías una nueva.</p>
        </aside>
      </div>
    </section>
  );
}