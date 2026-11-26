import { useEffect, useMemo, useRef, useState } from "react";
import { ApiError, solicitar } from "../../servicios/api";
import { inicialesDe } from "../../sesion/roles";

const POR_PAGINA = 10;

function fechaDe(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-GT", { dateStyle: "short", timeStyle: "short" });
}

export function PendientesReales({ onCambio }) {
  const dialogo = useRef(null);
  const [filas, setFilas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState("");
  const [rechazo, setRechazo] = useState(null);
  const [pagina, setPagina] = useState(1);

  async function cargar() {
    const datos = await solicitar("/solicitantes/pendientes");
    setFilas(datos.solicitantes || []);
  }

  useEffect(() => {
    let viva = true;
    cargar()
      .catch((fallo) => {
        if (viva) setError(fallo instanceof ApiError ? fallo.detail : "No se pudieron leer los solicitantes.");
      })
      .finally(() => {
        if (viva) setCargando(false);
      });
    return () => { viva = false; };
  }, []);

  const texto = busqueda.trim().toLowerCase();
  const visibles = useMemo(() => {
    if (!texto) return filas;
    return filas.filter((cuenta) => {
      const nit = cuenta.institucion?.nit || "";
      const institucion = cuenta.institucion?.nombreOficial || "";
      return `${cuenta.nombre} ${cuenta.email} ${institucion} ${nit} ${cuenta.cargo || ""}`.toLowerCase().includes(texto);
    });
  }, [filas, texto]);

  useEffect(() => { setPagina(1); }, [texto]);
  useEffect(() => {
    if (!exito) return undefined;
    const timer = window.setTimeout(() => setExito(""), 4200);
    return () => window.clearTimeout(timer);
  }, [exito]);

  const paginas = Math.max(1, Math.ceil(visibles.length / POR_PAGINA));
  const paginaSegura = Math.min(pagina, paginas);
  const paginaFilas = visibles.slice((paginaSegura - 1) * POR_PAGINA, paginaSegura * POR_PAGINA);

  async function revisar(usuarioId, accion) {
    setError("");
    setExito("");
    setOcupado(usuarioId);
    try {
      await solicitar(`/solicitantes/${usuarioId}/${accion}`, { method: "POST" });
      await cargar();
      onCambio?.();
      setExito(accion === "aprobar" ? "Cuenta activada." : "Cuenta rechazada.");
    } catch (fallo) {
      setError(fallo instanceof ApiError ? fallo.detail : "No se pudo revisar la cuenta.");
    } finally {
      setOcupado("");
    }
  }

  return (
    <>
      <div className="consola__barra consola__barra--compacta consola__barra--filtros">
        <label className="consola__buscar">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar nombre, correo, institución o NIT" aria-label="Buscar" />
        </label>
        <span className="consola__meta-pill">{visibles.length} en cola</span>
      </div>

      {exito ? <p className="consola__aviso consola__aviso--ok" role="status">{exito}</p> : null}
      {error ? <p className="consola__aviso consola__aviso--error" role="alert">{error}</p> : null}

      {cargando ? <p className="consola__vacio consola__vacio--chico">Leyendo solicitudes…</p> : null}

      {!cargando && !visibles.length ? (
        <p className="consola__vacio consola__vacio--chico">
          {filas.length ? "Ningún solicitante coincide con la búsqueda." : "No hay solicitantes en revisión."}
        </p>
      ) : null}

      {!cargando && paginaFilas.length ? (
        <div className="tabla-wrap tabla-wrap--plana">
          <table className="tabla tabla--densa tabla--admin">
            <thead>
              <tr>
                <th>Solicitante</th>
                <th>Institución</th>
                <th>Cargo</th>
                <th>Solicitado</th>
                <th>Correo verificado</th>
                <th className="tabla__accion">Decisión</th>
              </tr>
            </thead>
            <tbody>
              {paginaFilas.map((cuenta) => (
                <tr key={cuenta.usuarioId}>
                  <td>
                    <div className="persona persona--sm">
                      <span className="persona__avatar" aria-hidden="true">{inicialesDe(cuenta.nombre)}</span>
                      <div>
                        <strong>{cuenta.nombre}</strong>
                        <small>{cuenta.email}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong className="celda-titulo">{cuenta.institucion?.nombreOficial || "—"}</strong>
                    {cuenta.institucion?.nit ? <span className="celda-sec">NIT {cuenta.institucion.nit}</span> : null}
                  </td>
                  <td>{cuenta.cargo?.trim() ? cuenta.cargo : <span className="celda-vacia">Sin cargo</span>}</td>
                  <td className="consola__fecha">{fechaDe(cuenta.solicitadoEn)}</td>
                  <td className="consola__fecha">{fechaDe(cuenta.correoVerificadoEn)}</td>
                  <td className="tabla__accion">
                    <div className="consola__acciones consola__acciones--fila">
                      <button type="button" className="btn btn--naranja btn--sm" disabled={ocupado === cuenta.usuarioId} onClick={() => revisar(cuenta.usuarioId, "aprobar")}>
                        {ocupado === cuenta.usuarioId ? "…" : "Aprobar"}
                      </button>
                      <button type="button" className="btn btn--linea btn--sm" disabled={ocupado === cuenta.usuarioId} onClick={() => { setRechazo(cuenta); dialogo.current?.showModal(); }}>
                        Rechazar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {!cargando && visibles.length > POR_PAGINA ? (
        <footer className="consola__pager">
          <span>Pág. {paginaSegura} de {paginas}</span>
          <div>
            <button type="button" className="btn btn--linea btn--sm" disabled={paginaSegura <= 1} onClick={() => setPagina((v) => v - 1)}>Anterior</button>
            <button type="button" className="btn btn--linea btn--sm" disabled={paginaSegura >= paginas} onClick={() => setPagina((v) => v + 1)}>Siguiente</button>
          </div>
        </footer>
      ) : null}

      <dialog className="consola__dialog" ref={dialogo} onClose={() => setRechazo(null)}>
        <form onSubmit={(evento) => { evento.preventDefault(); const cuenta = rechazo; dialogo.current?.close(); setRechazo(null); if (cuenta) revisar(cuenta.usuarioId, "rechazar"); }}>
          <p className="consola__ceja">Revisión</p>
          <h2>Rechazar cuenta</h2>
          <p>{rechazo ? `${rechazo.nombre} quedará desactivado y no podrá ingresar.` : ""}</p>
          <div className="consola__acciones">
            <button type="submit" className="btn btn--naranja btn--sm">Confirmar rechazo</button>
            <button type="button" className="btn btn--linea btn--sm" onClick={() => dialogo.current?.close()}>Volver</button>
          </div>
        </form>
      </dialog>
    </>
  );
}