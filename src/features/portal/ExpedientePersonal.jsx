import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Contenedor } from "../../components/ui/Contenedor";
import { useSesion } from "../../sesion/Sesion";
import { ApiError, descargarArchivo, enviarArchivo, solicitar } from "../../servicios/api";
import { MarcaAtencion } from "../solicitud/Atencion";
import { PasosExpediente } from "../solicitud/PasosExpediente";

const ESTADOS = {
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

const SIGUIENTE = {
  RECIBIDA: "EN_REVISION",
  EN_REVISION: "EN_INVESTIGACION",
  EN_INVESTIGACION: "EN_ANALISIS",
  EN_ANALISIS: "EN_INFORME",
  EN_INFORME: "EN_ENTREGA",
  EN_ENTREGA: "COMPLETADA",
};

const PUEDE_DEVOLVER = new Set(["EN_REVISION", "EN_INVESTIGACION", "EN_ANALISIS"]);
const PUEDE_BOLETA = new Set(["EN_INVESTIGACION", "EN_ANALISIS"]);
const PUEDE_PAUSAR = new Set(["RECIBIDA", "EN_REVISION", "EN_INVESTIGACION", "EN_ANALISIS", "EN_INFORME", "EN_ENTREGA"]);

function pdfValido(archivo) {
  return archivo && archivo.size <= 10 * 1024 * 1024 && archivo.name.toLowerCase().endsWith(".pdf");
}

function puedeTrabajar(detalle, sesion) {
  if (!detalle) return false;
  if (sesion?.rol === "admin") return true;
  if (!detalle.asignadaAId) return false;
  if (detalle.asignadaAId === sesion?.id) return true;
  return (detalle.colaboradores || []).some((item) => item.usuario?.id === sesion?.id);
}

function puedeAsignar(sesion) {
  return sesion?.rol === "jefe" || sesion?.rol === "admin";
}

function textoError(fallo) {
  if (fallo instanceof ApiError) return fallo.errors?.[0]?.message || fallo.detail;
  return "No se pudo completar la acción.";
}

function fechaCorta(valor) {
  if (!valor) return "";
  return String(valor).slice(0, 10);
}

export function ExpedientePersonal() {
  const { sesion } = useSesion();
  const [params] = useSearchParams();
  const [filas, setFilas] = useState([]);
  const [adjuntos, setAdjuntos] = useState([]);
  const [colaborador, setColaborador] = useState("");
  const [mias, setMias] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [personal, setPersonal] = useState([]);
  const [fuentes, setFuentes] = useState([]);
  const [avisos, setAvisos] = useState([]);
  const [error, setError] = useState("");
  const [responsable, setResponsable] = useState("");
  const [comentario, setComentario] = useState({ contenido: "", esInterno: false, devolver: false });
  const [boleta, setBoleta] = useState({ fuenteId: "", fechaConsulta: fechaCorta(new Date().toISOString()), productoSolicitudId: "", precio: "", unidadMedida: "unidad", evidencia: "", referenciaIneId: "" });
  const [validacion, setValidacion] = useState({ productoSolicitudId: "", precioAdoptado: "", unidadMedida: "unidad", criterio: "" });
  const [informe, setInforme] = useState({ tipo: "INFORME_TECNICO", destinatario: "" });
  const [estadisticas, setEstadisticas] = useState(null);
  const [entrega, setEntrega] = useState({ medio: "DIGITAL", destinatario: "", fechaEntrega: fechaCorta(new Date().toISOString()), constancia: "" });
  const [busqueda, setBusqueda] = useState("");
  const [referencias, setReferencias] = useState([]);

  async function cargarLista(soloMias = mias) {
    const datos = await solicitar(`/solicitudes?limite=50${soloMias ? "&asignadasAMi=true" : ""}`);
    setFilas(datos.solicitudes || []);
  }

  useEffect(() => {
    let viva = true;
    Promise.all([
      solicitar("/solicitudes?limite=50"),
      solicitar("/personal-ine"),
      solicitar("/fuentes-consulta?soloActivas=true"),
      solicitar("/notificaciones?limite=8"),
    ]).then(([lista, gente, origenes, bandeja]) => {
      if (!viva) return;
      setFilas(lista.solicitudes || []);
      setPersonal(gente || []);
      setFuentes(origenes || []);
      setAvisos(bandeja.notificaciones || []);
      setBoleta((previo) => ({ ...previo, fuenteId: origenes?.[0]?.id || "" }));
    }).catch((fallo) => {
      if (viva) setError(textoError(fallo));
    });
    return () => {
      viva = false;
    };
  }, []);

  async function abrir(id) {
    setError("");
    const actual = await solicitar(`/solicitudes/${id}`);
    setDetalle(actual);
    setResponsable(actual.asignadaAId || "");
    const archivos = await solicitar(`/solicitudes/${id}/adjuntos`);
    setAdjuntos(archivos.adjuntos || []);
    if (actual.estado === "EN_INFORME") {
      const medidas = await solicitar(`/solicitudes/${id}/estadisticas`);
      setEstadisticas(medidas);
    } else {
      const emitido = (actual.informes || []).find((item) => item.estado === "EMITIDO" && item.estadisticas);
      setEstadisticas(emitido?.estadisticas || null);
    }
    const producto = actual.productos?.[0];
    if (producto) {
      setBoleta((previo) => ({ ...previo, productoSolicitudId: producto.id, unidadMedida: producto.unidadMedida || "unidad" }));
      setValidacion((previo) => ({ ...previo, productoSolicitudId: producto.id, unidadMedida: producto.unidadMedida || "unidad" }));
    }
  }

  useEffect(() => {
    const id = params.get("expediente");
    if (id) abrir(id).catch((fallo) => setError(textoError(fallo)));
  }, [params]);

  async function actuar(tarea) {
    if (!detalle) return;
    setError("");
    try {
      const actual = await tarea();
      if (actual?.id) {
        setDetalle(actual);
        const archivos = await solicitar(`/solicitudes/${actual.id}/adjuntos`);
        setAdjuntos(archivos.adjuntos || []);
        const emitido = (actual.informes || []).find((item) => item.estado === "EMITIDO" && item.estadisticas);
        if (emitido) setEstadisticas(emitido.estadisticas);
        else if (actual.estado === "EN_INFORME") setEstadisticas(await solicitar(`/solicitudes/${actual.id}/estadisticas`));
      } else await abrir(detalle.id);
      await cargarLista();
      const bandeja = await solicitar("/notificaciones?limite=8");
      setAvisos(bandeja.notificaciones || []);
    } catch (fallo) {
      setError(textoError(fallo));
    }
  }

  async function buscarCatalogo(evento) {
    evento.preventDefault();
    if (busqueda.trim().length < 2) return;
    setError("");
    try {
      const datos = await solicitar(`/referencias-ine?texto=${encodeURIComponent(busqueda.trim())}&limite=8`);
      setReferencias(datos.referencias || []);
    } catch (fallo) {
      setError(textoError(fallo));
    }
  }

  const siguiente = detalle ? SIGUIENTE[detalle.estado] : null;
  const cerrado = ["COMPLETADA", "RECHAZADA", "CANCELADA"].includes(detalle?.estado);
  const encargado = puedeTrabajar(detalle, sesion);

  return (
    <section className="pagina bloque expediente">
      <Contenedor>
        <header className="publicacion-encabezado">
          <h2>Bandeja del expediente</h2>
          <p>El jefe asigna cada solicitud a un trabajador. El tiempo de atención es de 15 días desde el envío.</p>
        </header>
        {error ? <p className="acceso__error" role="alert">{error}</p> : null}
        <div className="expediente__rejilla">
          <div className="acceso-lista">
            <h3>Solicitudes</h3>
            <label className="expediente__check">
              <input type="checkbox" checked={mias} onChange={(evento) => {
                const valor = evento.target.checked;
                setMias(valor);
                cargarLista(valor).catch((fallo) => setError(textoError(fallo)));
              }} />
              Solo las asignadas a mí
            </label>
            {filas.length === 0 ? <p>No hay solicitudes en esta bandeja.</p> : filas.map((item) => (
              <article key={item.id}>
                <button type="button" className="enlace-boton" onClick={() => abrir(item.id).catch((fallo) => setError(textoError(fallo)))}>
                  <strong>{item.codigo}</strong>
                </button>
                <span>{ESTADOS[item.estado] || item.estado}</span>
                <MarcaAtencion atencion={item.atencion} />
                <small>{item.titulo}</small>
              </article>
            ))}
            <h3>Avisos</h3>
            {avisos.length === 0 ? <p>No hay avisos.</p> : avisos.map((aviso) => (
              <article key={aviso.id}>
                <strong>{aviso.titulo}</strong>
                <small>{aviso.detalle}</small>
                {!aviso.leidaEn ? (
                  <button type="button" className="btn btn--linea" onClick={() => solicitar(`/notificaciones/${aviso.id}/leer`, { method: "POST" }).then(() => solicitar("/notificaciones?limite=8")).then((datos) => setAvisos(datos.notificaciones || [])).catch((fallo) => setError(textoError(fallo)))}>
                    Marcar leído
                  </button>
                ) : null}
              </article>
            ))}
          </div>

          {detalle ? (
            <div className="acceso-lista">
              <h3>{detalle.codigo} · {ESTADOS[detalle.estado] || detalle.estado}</h3>
              <p>{detalle.titulo}</p>
              <small>{detalle.institucionSolicitante}{detalle.asignadaA ? ` · Responsable: ${detalle.asignadaA.nombre}` : " · Sin responsable"}</small>
              <MarcaAtencion atencion={detalle.atencion} />
              <PasosExpediente estado={detalle.estado} historial={detalle.historial} />
              {(detalle.colaboradores || []).length ? (
                <p>Colaboran: {(detalle.colaboradores || []).map((item) => item.usuario?.nombre).filter(Boolean).join(", ")}</p>
              ) : null}
              {!detalle.asignadaAId ? <p>El jefe todavía no asigna este expediente a un trabajador.</p> : null}
              {detalle.asignadaAId && !encargado ? (
                <p>Este expediente lo trabaja {detalle.asignadaA?.nombre || "la persona asignada"}.</p>
              ) : null}
              <ul>
                {(detalle.productos || []).map((producto) => (
                  <li key={producto.id}>{producto.numero}. {producto.nombre} · {producto.cantidad} {producto.unidadMedida}</li>
                ))}
              </ul>

              {puedeAsignar(sesion) && !cerrado ? (
                <form onSubmit={(evento) => {
                  evento.preventDefault();
                  actuar(() => solicitar(`/solicitudes/${detalle.id}/asignar`, { method: "POST", cuerpo: { usuarioId: responsable } }));
                }}>
                  <label>
                    Responsable
                    <select value={responsable} onChange={(evento) => setResponsable(evento.target.value)} required>
                      <option value="">Elegir</option>
                      {personal.map((persona) => <option key={persona.id} value={persona.id}>{persona.nombre}</option>)}
                    </select>
                  </label>
                  <button type="submit" className="btn btn--linea">Asignar</button>
                </form>
              ) : null}

              {puedeAsignar(sesion) && !cerrado ? (
                <form onSubmit={(evento) => {
                  evento.preventDefault();
                  actuar(() => solicitar(`/solicitudes/${detalle.id}/colaboradores`, { method: "POST", cuerpo: { usuarioId: colaborador } }));
                }}>
                  <label>
                    Colaborador
                    <select value={colaborador} onChange={(evento) => setColaborador(evento.target.value)} required>
                      <option value="">Elegir</option>
                      {personal.filter((persona) => persona.id !== detalle.asignadaAId).map((persona) => (
                        <option key={persona.id} value={persona.id}>{persona.nombre}</option>
                      ))}
                    </select>
                  </label>
                  <button type="submit" className="btn btn--linea">Agregar colaborador</button>
                </form>
              ) : null}

              {!cerrado ? (
                <form onSubmit={(evento) => {
                  evento.preventDefault();
                  const cuerpo = comentario;
                  actuar(async () => {
                    const actual = await solicitar(`/solicitudes/${detalle.id}/comentarios`, { method: "POST", cuerpo });
                    setComentario({ contenido: "", esInterno: false, devolver: false });
                    return actual;
                  });
                }}>
                  <label>
                    Observación
                    <textarea value={comentario.contenido} onChange={(evento) => setComentario((previo) => ({ ...previo, contenido: evento.target.value }))} required minLength={1} />
                  </label>
                  <label className="expediente__check">
                    <input type="checkbox" checked={comentario.esInterno} onChange={(evento) => setComentario((previo) => ({ ...previo, esInterno: evento.target.checked, devolver: evento.target.checked ? false : previo.devolver }))} />
                    Nota interna
                  </label>
                  {encargado && PUEDE_DEVOLVER.has(detalle.estado) ? (
                    <label className="expediente__check">
                      <input type="checkbox" checked={comentario.devolver} disabled={comentario.esInterno} onChange={(evento) => setComentario((previo) => ({ ...previo, devolver: evento.target.checked }))} />
                      Devolver a la entidad
                    </label>
                  ) : null}
                  <button type="submit" className="btn btn--linea">Guardar observación</button>
                </form>
              ) : null}

              {encargado && siguiente ? (
                <button type="button" className="btn btn--naranja" onClick={() => actuar(() => solicitar(`/solicitudes/${detalle.id}/estado`, { method: "POST", cuerpo: { estado: siguiente } }))}>
                  Pasar a {ESTADOS[siguiente]}
                </button>
              ) : null}
              {encargado && PUEDE_PAUSAR.has(detalle.estado) ? (
                <button type="button" className="btn btn--linea" onClick={() => actuar(() => solicitar(`/solicitudes/${detalle.id}/pausar`, { method: "POST" }))}>
                  Poner en espera
                </button>
              ) : null}
              {encargado && detalle.estado === "EN_ESPERA" ? (
                <button type="button" className="btn btn--naranja" onClick={() => actuar(() => solicitar(`/solicitudes/${detalle.id}/reanudar`, { method: "POST" }))}>
                  Reanudar
                </button>
              ) : null}
              {encargado && !cerrado && detalle.estado !== "PENDIENTE_SUBSANACION" && detalle.estado !== "EN_ESPERA" ? (
                <button type="button" className="btn btn--linea" onClick={() => actuar(() => solicitar(`/solicitudes/${detalle.id}/estado`, { method: "POST", cuerpo: { estado: "RECHAZADA", motivo: "Rechazada desde la bandeja" } }))}>
                  Rechazar
                </button>
              ) : null}

              {encargado && PUEDE_BOLETA.has(detalle.estado) ? (
                <form onSubmit={(evento) => {
                  evento.preventDefault();
                  const archivo = evento.currentTarget.archivo.files?.[0];
                  if (archivo && !pdfValido(archivo)) {
                    setError("La evidencia tiene que ser un PDF de hasta 10 MB.");
                    return;
                  }
                  const formulario = evento.currentTarget;
                  actuar(async () => {
                    const actual = await solicitar(`/solicitudes/${detalle.id}/consultas`, {
                      method: "POST",
                      cuerpo: {
                      fuenteId: boleta.fuenteId,
                      fechaConsulta: boleta.fechaConsulta,
                      ...(boleta.evidencia.trim() ? { evidencia: boleta.evidencia.trim() } : {}),
                      precios: [{
                        productoSolicitudId: boleta.productoSolicitudId,
                        precio: boleta.precio.trim(),
                        unidadMedida: boleta.unidadMedida.trim(),
                        moneda: "GTQ",
                        ...(boleta.referenciaIneId ? { referenciaIneId: boleta.referenciaIneId } : {}),
                      }],
                    },
                  });
                    const consulta = (actual.consultas || []).at(-1);
                    if (archivo && consulta) {
                      await enviarArchivo(`/solicitudes/${actual.id}/adjuntos`, archivo, { consultaId: consulta.id });
                    }
                    formulario.reset();
                    return actual;
                  });
                }}>
                  <h3>Boleta</h3>
                  <label>
                    Fuente
                    <select value={boleta.fuenteId} onChange={(evento) => setBoleta((previo) => ({ ...previo, fuenteId: evento.target.value }))} required>
                      {fuentes.map((fuente) => <option key={fuente.id} value={fuente.id}>{fuente.nombre}</option>)}
                    </select>
                  </label>
                  <label>
                    Fecha
                    <input type="date" value={boleta.fechaConsulta} onChange={(evento) => setBoleta((previo) => ({ ...previo, fechaConsulta: evento.target.value }))} required />
                  </label>
                  <label>
                    Producto
                    <select value={boleta.productoSolicitudId} onChange={(evento) => setBoleta((previo) => ({ ...previo, productoSolicitudId: evento.target.value }))}>
                      {(detalle.productos || []).map((producto) => <option key={producto.id} value={producto.id}>{producto.nombre}</option>)}
                    </select>
                  </label>
                  <label>
                    Precio observado
                    <input value={boleta.precio} onChange={(evento) => setBoleta((previo) => ({ ...previo, precio: evento.target.value }))} inputMode="decimal" required placeholder="El analista lo escribe" />
                  </label>
                  <label>
                    Unidad
                    <input value={boleta.unidadMedida} onChange={(evento) => setBoleta((previo) => ({ ...previo, unidadMedida: evento.target.value }))} required />
                  </label>
                  <label>
                    Evidencia
                    <input value={boleta.evidencia} onChange={(evento) => setBoleta((previo) => ({ ...previo, evidencia: evento.target.value }))} placeholder="Referencia del documento" />
                  </label>
                  <label>
                    PDF de la boleta, si ya se tiene
                    <input name="archivo" type="file" accept="application/pdf,.pdf" />
                  </label>
                  {boleta.referenciaIneId ? <small>Referencia de catálogo ligada: {boleta.referenciaIneId}</small> : null}
                  <button type="submit" className="btn btn--linea">Registrar boleta</button>
                </form>
              ) : null}

              {encargado && PUEDE_BOLETA.has(detalle.estado) ? (
                <form onSubmit={buscarCatalogo}>
                  <h3>Catálogo interno</h3>
                  <label>
                    Buscar
                    <input value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} minLength={2} placeholder="Producto, característica o NOG" />
                  </label>
                  <button type="submit" className="btn btn--linea">Buscar</button>
                  <ul>
                    {referencias.map((fila) => (
                      <li key={fila.id}>
                        {fila.producto} · Q {fila.precioReferencia}
                        <button type="button" className="btn btn--linea" onClick={() => setBoleta((previo) => ({ ...previo, referenciaIneId: fila.id }))}>
                          Ligar sin copiar el precio
                        </button>
                      </li>
                    ))}
                  </ul>
                </form>
              ) : null}

              {(detalle.consultas || []).map((consulta) => (
                <article key={consulta.id}>
                  <strong>{consulta.fuente?.nombre}</strong>
                  <small>{fechaCorta(consulta.fechaConsulta)}</small>
                  {(consulta.precios || []).map((precio) => (
                    <form key={precio.id} onSubmit={(evento) => {
                      evento.preventDefault();
                      if (!PUEDE_BOLETA.has(detalle.estado)) return;
                      const form = new FormData(evento.currentTarget);
                      actuar(() => solicitar(`/solicitudes/${detalle.id}/consultas/${consulta.id}`, {
                        method: "PATCH",
                        cuerpo: { precios: [{ id: precio.id, precio: String(form.get("precio")) }] },
                      }));
                    }}>
                      <span>{precio.moneda} {String(precio.precio)} {precio.unidadMedida}{precio.esAtipico ? " · atípico" : ""}</span>
                      {encargado && PUEDE_BOLETA.has(detalle.estado) ? (
                        <>
                          <input name="precio" defaultValue={String(precio.precio)} />
                          <button type="submit" className="btn btn--linea">Corregir</button>
                        </>
                      ) : null}
                      {encargado && detalle.estado === "EN_ANALISIS" ? (
                        <button type="button" className="btn btn--linea" onClick={() => actuar(() => solicitar(`/solicitudes/${detalle.id}/atipicos`, {
                          method: "POST",
                          cuerpo: { precioConsultadoId: precio.id, esAtipico: !precio.esAtipico },
                        }))}>
                          {precio.esAtipico ? "Quitar atípico" : "Marcar atípico"}
                        </button>
                      ) : null}
                    </form>
                  ))}
                </article>
              ))}

              {encargado && detalle.estado === "EN_ANALISIS" ? (
                <form onSubmit={(evento) => {
                  evento.preventDefault();
                  actuar(() => solicitar(`/solicitudes/${detalle.id}/validaciones`, {
                    method: "POST",
                    cuerpo: { ...validacion, moneda: "GTQ", confirmar: true },
                  }));
                }}>
                  <h3>Precio oficial</h3>
                  <label>
                    Producto
                    <select value={validacion.productoSolicitudId} onChange={(evento) => setValidacion((previo) => ({ ...previo, productoSolicitudId: evento.target.value }))}>
                      {(detalle.productos || []).map((producto) => <option key={producto.id} value={producto.id}>{producto.nombre}</option>)}
                    </select>
                  </label>
                  <label>
                    Precio que confirma el analista
                    <input value={validacion.precioAdoptado} onChange={(evento) => setValidacion((previo) => ({ ...previo, precioAdoptado: evento.target.value }))} required />
                  </label>
                  <label>
                    Unidad
                    <input value={validacion.unidadMedida} onChange={(evento) => setValidacion((previo) => ({ ...previo, unidadMedida: evento.target.value }))} required />
                  </label>
                  <label>
                    Criterio
                    <textarea value={validacion.criterio} onChange={(evento) => setValidacion((previo) => ({ ...previo, criterio: evento.target.value }))} required minLength={3} />
                  </label>
                  <button type="submit" className="btn btn--naranja">Confirmar precio</button>
                </form>
              ) : null}

              {(detalle.validaciones || []).map((item) => (
                <p key={item.id}>Validación {item.confirmada ? "confirmada" : "en borrador"}: {item.moneda} {String(item.precioAdoptado)} · {item.criterio}</p>
              ))}

              <Graficas medidas={estadisticas} />

              {encargado && detalle.estado === "EN_INFORME" ? (
                <form onSubmit={(evento) => {
                  evento.preventDefault();
                  actuar(() => solicitar(`/solicitudes/${detalle.id}/informes`, {
                    method: "POST",
                    cuerpo: { tipo: "INFORME_TECNICO", destinatario: informe.destinatario },
                  }));
                }}>
                  <h3>Documento del expediente</h3>
                  <p>Incluye el informe técnico, el oficio y la estadística. Se puede corregir el texto antes de emitirlo.</p>
                  <label>
                    Destinatario
                    <input value={informe.destinatario} onChange={(evento) => setInforme((previo) => ({ ...previo, destinatario: evento.target.value }))} required minLength={3} />
                  </label>
                  <button type="submit" className="btn btn--linea">Preparar borrador</button>
                </form>
              ) : null}
              {(detalle.informes || []).map((item) => (
                <article key={item.id}>
                  <strong>{item.tipo} v{item.version} · {item.estado}</strong>
                  <small>{item.destinatario}</small>
                  <p>{item.resumen}</p>
                  {encargado && item.estado !== "EMITIDO" && detalle.estado === "EN_INFORME" ? (
                    <button type="button" className="btn btn--naranja" onClick={() => actuar(() => solicitar(`/solicitudes/${detalle.id}/informes/${item.id}/emitir`, { method: "POST" }))}>
                      Emitir
                    </button>
                  ) : null}
                </article>
              ))}

              {encargado && detalle.estado === "EN_ENTREGA" ? (
                <form onSubmit={(evento) => {
                  evento.preventDefault();
                  const archivo = evento.currentTarget.archivo.files?.[0];
                  if (archivo && !pdfValido(archivo)) {
                    setError("La constancia tiene que ser un PDF de hasta 10 MB.");
                    return;
                  }
                  const formulario = evento.currentTarget;
                  actuar(async () => {
                    const actual = await solicitar(`/solicitudes/${detalle.id}/entregas`, { method: "POST", cuerpo: entrega });
                    const registrada = (actual.entregas || []).at(-1);
                    if (archivo && registrada) {
                      await enviarArchivo(`/solicitudes/${actual.id}/adjuntos`, archivo, { entregaId: registrada.id });
                    }
                    formulario.archivo.value = "";
                    return actual;
                  });
                }}>
                  <h3>Entrega</h3>
                  <label>
                    Medio
                    <select value={entrega.medio} onChange={(evento) => setEntrega((previo) => ({ ...previo, medio: evento.target.value }))}>
                      <option value="DIGITAL">Digital</option>
                      <option value="FISICA">Física</option>
                      <option value="CD">CD</option>
                    </select>
                  </label>
                  <label>
                    Destinatario
                    <input value={entrega.destinatario} onChange={(evento) => setEntrega((previo) => ({ ...previo, destinatario: evento.target.value }))} required />
                  </label>
                  <label>
                    Fecha
                    <input type="date" value={entrega.fechaEntrega} onChange={(evento) => setEntrega((previo) => ({ ...previo, fechaEntrega: evento.target.value }))} required />
                  </label>
                  <label>
                    Constancia
                    <textarea value={entrega.constancia} onChange={(evento) => setEntrega((previo) => ({ ...previo, constancia: evento.target.value }))} required minLength={3} />
                  </label>
                  <label>
                    PDF de la constancia, si ya se tiene
                    <input name="archivo" type="file" accept="application/pdf,.pdf" />
                  </label>
                  <button type="submit" className="btn btn--naranja">Registrar entrega</button>
                </form>
              ) : null}

              <h3>Archivos</h3>
              {adjuntos.length === 0 ? <p>No hay PDF en este expediente.</p> : (
                <ul>
                  {adjuntos.map((archivo) => (
                    <li key={archivo.id}>
                      <button type="button" className="enlace-boton" onClick={() => descargarArchivo(`/solicitudes/${detalle.id}/adjuntos/${archivo.id}`, archivo.nombreOriginal).catch((fallo) => setError(textoError(fallo)))}>
                        {archivo.nombreOriginal}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <h3>Historial</h3>
              <ul>
                {(detalle.historial || []).map((evento) => (
                  <li key={evento.id}>{evento.accion}{evento.detalle ? ` · ${evento.detalle}` : ""}</li>
                ))}
              </ul>
              <h3>Observaciones</h3>
              <ul>
                {(detalle.comentarios || []).map((item) => (
                  <li key={item.id}>{item.esInterno ? "Interna: " : ""}{item.contenido}</li>
                ))}
              </ul>
            </div>
          ) : <p>Elige una solicitud para trabajar el expediente.</p>}
        </div>
      </Contenedor>
    </section>
  );
}

function Graficas({ medidas }) {
  const productos = medidas?.productos || [];
  if (!productos.length) return null;
  return (
    <div>
      <h3>Estadística</h3>
      {productos.map((producto) => (
        <article key={producto.productoSolicitudId}>
          <strong>{producto.nombre}</strong>
          <div dangerouslySetInnerHTML={{ __html: producto.grafica }} />
          <p>{producto.interpretacion}</p>
          {(producto.excluidos || []).length ? (
            <small>
              Fuera del cálculo: {producto.excluidos.map((precio) => `${precio.fuente} ${precio.precio} (${precio.motivo})`).join("; ")}
            </small>
          ) : null}
        </article>
      ))}
    </div>
  );
}
