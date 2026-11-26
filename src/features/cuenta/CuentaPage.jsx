import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Contenedor } from "../../components/ui/Contenedor";
import { Etiqueta } from "../../components/ui/Etiqueta";
import { ROLES } from "../../sesion/roles";
import { useSesion } from "../../sesion/Sesion";
import { ApiError, descargarArchivo, enviarArchivo, solicitar } from "../../servicios/api";
import { MarcaAtencion } from "../solicitud/Atencion";
import { AdjuntosPdf, ListaAdjuntosDescarga } from "../solicitud/AdjuntosPdf";
import { PasosExpediente, resumenProgresoExpediente } from "../solicitud/PasosExpediente";
import { MisSolicitudes } from "./MisSolicitudes";
import "./detalleSolicitud.css";
import { runTourCuenta, useTourCuenta } from "../../tours/tourCuenta";

const ESTADOS = {
  BORRADOR: "Borrador",
  RECIBIDA: "Recibida",
  EN_REVISION: "En revisión",
  PENDIENTE_SUBSANACION: "Pendiente de subsanación",
  EN_INVESTIGACION: "En investigación",
  EN_ANALISIS: "En análisis",
  EN_INFORME: "En informe",
  EN_ENTREGA: "En entrega",
  COMPLETADA: "Completada",
  RECHAZADA: "Rechazada",
  EN_ESPERA: "En espera",
  CANCELADA: "Anulada",
};

const CANCELABLES = new Set([
  "RECIBIDA",
  "EN_REVISION",
  "PENDIENTE_SUBSANACION",
  "EN_INVESTIGACION",
  "EN_ANALISIS",
  "EN_INFORME",
  "EN_ESPERA",
]);

export function CuentaPage() {
  const { sesion } = useSesion();
  const [params] = useSearchParams();
  const rol = ROLES[sesion?.rol] ?? ROLES.solicitante;
  const veExpedientes = sesion?.rol === "solicitante" || sesion?.rol === "jefe" || sesion?.rol === "trabajador" || sesion?.rol === "admin";
  const [filas, setFilas] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [adjuntos, setAdjuntos] = useState([]);
  const [edicion, setEdicion] = useState(null);
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  useTourCuenta(veExpedientes ? sesion?.rol : null);

  useEffect(() => {
    if (!veExpedientes) return undefined;
    let viva = true;
    solicitar("/solicitudes?limite=25")
      .then((datos) => {
        if (viva) setFilas(datos.solicitudes || []);
      })
      .catch((fallo) => {
        if (viva) setError(fallo instanceof ApiError ? fallo.detail : "No se pudieron leer las solicitudes.");
      });
    return () => {
      viva = false;
    };
  }, [veExpedientes]);

  function prepararEdicion(actual) {
    setEdicion({
      descripcion: actual.descripcion || "",
      productos: (actual.productos || []).map((producto) => ({
        nombre: producto.nombre,
        especificacionesTecnicas: producto.especificacionesTecnicas || "",
        unidadMedida: producto.unidadMedida || "",
        cantidad: producto.cantidad == null ? "" : String(producto.cantidad),
      })),
    });
  }

  async function abrir(id) {
    setError("");
    setAviso("");
    try {
      const actual = await solicitar(`/solicitudes/${id}`);
      setDetalle(actual);
      prepararEdicion(actual);
      const archivos = await solicitar(`/solicitudes/${id}/adjuntos`);
      setAdjuntos(archivos.adjuntos || []);
    } catch (fallo) {
      setError(fallo instanceof ApiError ? fallo.detail : "No se pudo abrir la solicitud.");
    }
  }

  useEffect(() => {
    const id = params.get("expediente");
    if (id) abrir(id);
  }, [params]);

  async function refrescar(actual) {
    setDetalle(actual);
    prepararEdicion(actual);
    const datos = await solicitar("/solicitudes?limite=25");
    setFilas(datos.solicitudes || []);
  }

  async function reenviar(id) {
    setError("");
    setAviso("");
    try {
      const actualizada = await solicitar(`/solicitudes/${id}/reenviar`, { method: "POST" });
      await refrescar(actualizada);
      setAviso(`La solicitud ${actualizada.codigo} volvió a recibida.`);
    } catch (fallo) {
      setError(fallo instanceof ApiError ? fallo.detail : "No se pudo reenviar la solicitud.");
    }
  }

  return (
    <section className={`pagina bloque${veExpedientes ? " mesa-pagina" : ""}`}>
      <Contenedor>
        <header className="publicacion-encabezado">
          <Etiqueta>{rol.etiqueta}</Etiqueta>
          <div className="publicacion-encabezado__titulo" id="cuenta-intro">
            <h2>{sesion ? sesion.nombre : "Sesión"}</h2>
            {veExpedientes ? (
              <button type="button" className="mesa-tutorial" id="cuenta-tutorial" onClick={() => runTourCuenta(sesion?.rol)}>
                Tutorial
              </button>
            ) : null}
          </div>
          {sesion?.rol === "solicitante" ? (
            <Link id="cuenta-cta" className="btn btn--naranja publicacion-encabezado__cta" to="/solicitud">
              Nueva solicitud
            </Link>
          ) : null}
          {sesion?.rol === "jefe" || sesion?.rol === "trabajador" || sesion?.rol === "admin" ? (
            <Link id="cuenta-cta" className="btn btn--naranja publicacion-encabezado__cta" to="/personal">
              Abrir bandeja
            </Link>
          ) : null}
          <div className="aviso-oficial">
            <p>{rol.resumen}</p>
          </div>
        </header>

        {error ? <p className="acceso__error" role="alert">{error}</p> : null}
        {aviso ? <p className="acceso__ok" role="status">{aviso}</p> : null}

        {sesion?.rol === "solicitante" ? (
          <MisSolicitudes
            filas={filas}
            estadosEtiqueta={ESTADOS}
            onAbrir={abrir}
          />
        ) : null}

        {sesion?.rol === "jefe" || sesion?.rol === "trabajador" || sesion?.rol === "admin" ? (
          <MisSolicitudes
            vacioSinDatos="Aún no entra ninguna solicitud."
            nuevaRuta="/personal"
            nuevaEtiqueta="Abrir bandeja"
            filas={filas}
            estadosEtiqueta={ESTADOS}
            onAbrir={abrir}
          />
        ) : null}

        <Ventana
          abierto={Boolean(detalle)}
          onCerrar={async () => {
            setDetalle(null);
            setAdjuntos([]);
            if (veExpedientes) {
              const datos = await solicitar("/solicitudes?limite=25");
              setFilas(datos.solicitudes || []);
            }
          }}
        >
          {detalle ? (
            <DetalleSolicitante
              detalle={detalle}
              edicion={edicion}
              setEdicion={setEdicion}
              adjuntos={adjuntos}
              setAdjuntos={setAdjuntos}
              comentario={comentario}
              setComentario={setComentario}
              esAutor={sesion?.rol === "solicitante"}
              onError={setError}
              onAviso={setAviso}
              onActualizar={refrescar}
              onReenviar={reenviar}
              onCerrar={async () => {
                setDetalle(null);
                setAdjuntos([]);
                const datos = await solicitar("/solicitudes?limite=25");
                setFilas(datos.solicitudes || []);
              }}
            />
          ) : null}
        </Ventana>

        {sesion?.rol === "proveedor" ? (
          <div className="acceso-lista">
            <h3>Catálogo</h3>
            <p>Los productos, el precio vigente y el historial se consultan en la vista del proveedor.</p>
            <Link className="btn btn--naranja" to="/proveedor">Ir a mis productos</Link>
          </div>
        ) : null}

        {sesion?.rol === "admin" ? (
          <div className="acceso-lista">
            <h3>Gestión</h3>
            <p>Las cuentas pendientes de aprobación se revisan en administración.</p>
            <Link className="btn btn--naranja" to="/admin">Ir a administración</Link>
          </div>
        ) : null}
      </Contenedor>
    </section>
  );
}

function DetalleSolicitante({
  detalle,
  edicion,
  setEdicion,
  adjuntos,
  setAdjuntos,
  comentario,
  setComentario,
  esAutor,
  onError,
  onAviso,
  onActualizar,
  onReenviar,
  onCerrar,
}) {
  const corrige = esAutor && detalle.estado === "PENDIENTE_SUBSANACION";
  const borrador = esAutor && detalle.estado === "BORRADOR";

  async function guardarCorreccion(evento) {
    evento.preventDefault();
    onError("");
    onAviso("");
    try {
      const actual = await solicitar(`/solicitudes/${detalle.id}`, {
        method: "PATCH",
        cuerpo: {
          descripcion: edicion.descripcion,
          productos: edicion.productos,
        },
      });
      await onActualizar(actual);
      onAviso("La corrección quedó guardada. Ya puedes reenviarla.");
    } catch (fallo) {
      onError(fallo instanceof ApiError ? fallo.detail : "No se pudo guardar la corrección.");
    }
  }

  async function comentar(evento) {
    evento.preventDefault();
    onError("");
    try {
      const actual = await solicitar(`/solicitudes/${detalle.id}/comentarios`, {
        method: "POST",
        cuerpo: { contenido: comentario },
      });
      await onActualizar(actual);
      setComentario("");
    } catch (fallo) {
      onError(fallo instanceof ApiError ? fallo.detail : "No se pudo guardar la observación.");
    }
  }

  async function anular() {
    onError("");
    try {
      const actual = await solicitar(`/solicitudes/${detalle.id}/cancelar`, { method: "POST" });
      await onActualizar(actual);
      onAviso(`La solicitud ${actual.codigo} quedó anulada.`);
    } catch (fallo) {
      onError(fallo instanceof ApiError ? fallo.detail : "No se pudo anular la solicitud.");
    }
  }

  async function descartar() {
    onError("");
    try {
      await solicitar(`/solicitudes/${detalle.id}`, { method: "DELETE" });
      await onCerrar();
      onAviso("El borrador se eliminó.");
    } catch (fallo) {
      onError(fallo instanceof ApiError ? fallo.detail : "No se pudo eliminar el borrador.");
    }
  }

  async function subir(evento) {
    const archivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!archivo) return;
    if (archivo.size > 10 * 1024 * 1024 || !archivo.name.toLowerCase().endsWith(".pdf")) {
      onError("El anexo tiene que ser un PDF de hasta 10 MB.");
      return;
    }
    onError("");
    try {
      await enviarArchivo(`/solicitudes/${detalle.id}/adjuntos`, archivo);
      const archivos = await solicitar(`/solicitudes/${detalle.id}/adjuntos`);
      setAdjuntos(archivos.adjuntos || []);
    } catch (fallo) {
      onError(fallo instanceof ApiError ? fallo.detail : "No se pudo adjuntar el PDF.");
    }
  }

  const resumenPaso = resumenProgresoExpediente(detalle.estado, detalle.historial);

  return (
    <article className="dialogo-producto__panel formulario detalle-sol-panel">
      <button type="button" className="dialogo-cerrar" onClick={onCerrar} aria-label="Cerrar expediente">
        ×
      </button>
      <header className="dialogo-producto__cab detalle-sol__cab">
        <div className="detalle-sol__cab-grid">
          <div className="detalle-sol__cab-izq">
            <p className="etiqueta">{detalle.codigo}</p>
            <h3>{detalle.titulo || "Solicitud"}</h3>
            <p className="detalle-sol__inst">{detalle.institucionSolicitante}</p>
          </div>
          <div className="detalle-sol__cab-der">
            <div className="dialogo-producto__meta detalle-sol__cab-meta">
              <span className={`chip ${detalle.estado === "COMPLETADA" ? "chip--ok" : detalle.estado === "PENDIENTE_SUBSANACION" ? "chip--aviso" : "chip--neutro"}`}>
                {ESTADOS[detalle.estado] || detalle.estado}
              </span>
              {resumenPaso ? <span className="detalle-sol__resumen-paso">{resumenPaso}</span> : null}
            </div>
            <MarcaAtencion atencion={detalle.atencion} />
            {detalle.asignadaA ? (
              <span className="detalle-sol-hero__resp">
                INE: <strong>{detalle.asignadaA.nombre}</strong>
              </span>
            ) : (
              <span className="detalle-sol-hero__resp detalle-sol-hero__resp--muted">INE: sin asignar</span>
            )}
          </div>
        </div>
      </header>

      <div className="dialogo-producto__cuerpo detalle-sol">
        <div className="detalle-sol__mosaico">
          <aside className="detalle-sol__lateral" aria-labelledby="detalle-seguimiento-titulo">
            <h4 id="detalle-seguimiento-titulo">Seguimiento</h4>
            <PasosExpediente estado={detalle.estado} historial={detalle.historial} variante="columna" />
          </aside>

          <div className="detalle-sol__principal">
            {detalle.descripcion ? (
              <section className="detalle-sol__bloque detalle-sol__bloque--desc">
                <h4>Descripción</h4>
                <p>{detalle.descripcion}</p>
              </section>
            ) : null}

            {(detalle.productos || []).length > 0 ? (
              <section className="detalle-sol__bloque detalle-sol__bloque--prod">
                <h4>Productos ({detalle.productos.length})</h4>
                <ul className="detalle-sol__productos">
                  {(detalle.productos || []).map((producto) => (
                    <li key={producto.id || producto.numero}>
                      <b>{producto.numero}.</b> {producto.nombre}
                      <span>{producto.cantidad} {producto.unidadMedida}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="detalle-sol__bloque detalle-sol__bloque--arch">
              <h4>Archivos</h4>
              <ListaAdjuntosDescarga
                adjuntos={adjuntos}
                puedeQuitar={borrador}
                onDescargar={(archivo) => descargarArchivo(
                  `/solicitudes/${detalle.id}/adjuntos/${archivo.id}`,
                  archivo.nombreOriginal,
                ).catch((fallo) => onError(fallo instanceof ApiError ? fallo.detail : "No se pudo descargar el PDF."))}
                onQuitar={(adjuntoId) => solicitar(`/solicitudes/${detalle.id}/adjuntos/${adjuntoId}`, { method: "DELETE" })
                  .then(() => setAdjuntos((previo) => previo.filter((item) => item.id !== adjuntoId)))
                  .catch((fallo) => onError(fallo instanceof ApiError ? fallo.detail : "No se pudo quitar el PDF."))}
              />
              {borrador ? (
                <AdjuntosPdf
                  archivos={[]}
                  multiple={false}
                  onChange={(lista) => {
                    if (lista[0]) subir({ target: { files: [lista[0]] } });
                  }}
                  mostrarLista={false}
                />
              ) : null}
            </section>

            <section className="detalle-sol__bloque detalle-sol__bloque--obs">
              <h4>Observaciones del INE</h4>
              {(detalle.comentarios || []).length ? (
                <ul className="detalle-sol__notas">
                  {(detalle.comentarios || []).map((item) => (
                    <li key={item.id}>
                      <strong>{item.autor?.nombre || "INE"}</strong>
                      <span>{item.contenido}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="detalle-sol__vacio">No hay observaciones por ahora.</p>}
              {esAutor && !["COMPLETADA", "RECHAZADA", "CANCELADA"].includes(detalle.estado) ? (
                <form className="detalle-sol__respuesta" onSubmit={comentar}>
                  <label>
                    Tu respuesta
                    <textarea
                      value={comentario}
                      onChange={(evento) => setComentario(evento.target.value)}
                      required
                      minLength={1}
                      rows={2}
                      placeholder="Aclara dudas o aporta información"
                    />
                  </label>
                  <div className="detalle-sol__form-acciones">
                    <button type="submit" className="btn btn--linea btn--chico">Enviar observación</button>
                  </div>
                </form>
              ) : null}
            </section>
          </div>
        </div>

        {corrige && edicion ? (
          <section className="detalle-sol__bloque detalle-sol__bloque--ancho">
            <h4>Corregir expediente</h4>
            <form onSubmit={guardarCorreccion}>
              <label>
                Descripción
                <textarea
                  value={edicion.descripcion}
                  onChange={(evento) => setEdicion((previo) => ({ ...previo, descripcion: evento.target.value }))}
                  required
                  rows={4}
                />
              </label>
              {edicion.productos.map((producto, indice) => (
                <fieldset key={indice} className="sol-producto">
                  <legend>{producto.nombre}</legend>
                  <label>
                    Especificaciones
                    <textarea
                      value={producto.especificacionesTecnicas}
                      onChange={(evento) => setEdicion((previo) => ({
                        ...previo,
                        productos: previo.productos.map((item, posicion) => (
                          posicion === indice ? { ...item, especificacionesTecnicas: evento.target.value } : item
                        )),
                      }))}
                      required
                      rows={3}
                    />
                  </label>
                  <div className="sol-producto__mitad">
                    <label>
                      Unidad
                      <input
                        value={producto.unidadMedida}
                        onChange={(evento) => setEdicion((previo) => ({
                          ...previo,
                          productos: previo.productos.map((item, posicion) => (
                            posicion === indice ? { ...item, unidadMedida: evento.target.value } : item
                          )),
                        }))}
                        required
                      />
                    </label>
                    <label>
                      Cantidad
                      <input
                        value={producto.cantidad}
                        onChange={(evento) => setEdicion((previo) => ({
                          ...previo,
                          productos: previo.productos.map((item, posicion) => (
                            posicion === indice ? { ...item, cantidad: evento.target.value } : item
                          )),
                        }))}
                        required
                      />
                    </label>
                  </div>
                </fieldset>
              ))}
              <div className="detalle-sol__form-acciones">
                <button type="submit" className="btn btn--linea">Guardar corrección</button>
              </div>
            </form>
          </section>
        ) : null}
      </div>
      <footer className="dialogo-producto__pie detalle-sol__pie">
        <div className="detalle-sol__form-acciones">
          {corrige ? (
            <button type="button" className="btn btn--naranja" onClick={() => onReenviar(detalle.id)}>Reenviar al INE</button>
          ) : null}
          {borrador ? (
            <button type="button" className="btn btn--linea" onClick={descartar}>Eliminar borrador</button>
          ) : null}
          {esAutor && CANCELABLES.has(detalle.estado) ? (
            <button type="button" className="btn btn--linea" onClick={anular}>Anular solicitud</button>
          ) : null}
        </div>
        <button type="button" className="btn btn--azul" onClick={onCerrar}>Cerrar</button>
      </footer>
    </article>
  );
}

function Ventana({ abierto, onCerrar, children }) {
  const dialogo = useRef(null);

  useEffect(() => {
    const nodo = dialogo.current;
    if (!nodo) return;
    if (abierto && !nodo.open) nodo.showModal();
    if (!abierto && nodo.open) nodo.close();
  }, [abierto]);

  return (
    <dialog
      ref={dialogo}
      className="dialogo-producto dialogo-producto--ficha dialogo-producto--expediente"
      onClose={onCerrar}
      onClick={(evento) => {
        if (evento.target === dialogo.current) onCerrar();
      }}
    >
      {children}
    </dialog>
  );
}
