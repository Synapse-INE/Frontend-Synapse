import { useEffect, useState } from "react";
import { useSesion } from "../../sesion/Sesion";
import { enviarArchivo, solicitar } from "../../servicios/api";
import { avisosActualizados } from "../../servicios/avisosUi";
import { GuiaFaseTrabajo } from "./GuiaFaseTrabajo";
import {
  ESTADOS_TRABAJO,
  PUEDE_BOLETA,
  PUEDE_DEVOLVER,
  PUEDE_PAUSAR,
  SIGUIENTE_ESTADO,
  fechaCorta,
  pdfValido,
  puedeTrabajar,
  textoErrorTrabajo,
} from "./expedienteTrabajoUtil";
import { etiquetaEstado } from "./expedienteGuiaFase";

export function PanelTrabajoExpediente({ detalle, setDetalle, setError, onLista, onTramiteActualizado }) {
  const { sesion } = useSesion();
  const [fuentes, setFuentes] = useState([]);
  const [comentario, setComentario] = useState({ contenido: "", esInterno: false, devolver: false });
  const [boleta, setBoleta] = useState({
    fuenteId: "",
    fechaConsulta: fechaCorta(new Date().toISOString()),
    productoSolicitudId: "",
    precio: "",
    unidadMedida: "unidad",
    evidencia: "",
    referenciaIneId: "",
  });
  const [validacion, setValidacion] = useState({ productoSolicitudId: "", precioAdoptado: "", unidadMedida: "unidad", criterio: "" });
  const [informe, setInforme] = useState({ destinatario: "" });
  const [entrega, setEntrega] = useState({
    medio: "DIGITAL",
    destinatario: "",
    fechaEntrega: fechaCorta(new Date().toISOString()),
    constancia: "",
  });
  const [ocupado, setOcupado] = useState(false);
  const [confirmarAvance, setConfirmarAvance] = useState(false);
  const [exito, setExito] = useState(null);

  useEffect(() => {
    solicitar("/fuentes-consulta?soloActivas=true")
      .then((origenes) => {
        setFuentes(Array.isArray(origenes) ? origenes : []);
        setBoleta((previo) => ({ ...previo, fuenteId: origenes?.[0]?.id || "" }));
      })
      .catch(() => setFuentes([]));
  }, []);

  useEffect(() => {
    const producto = detalle?.productos?.[0];
    if (!producto) return;
    setBoleta((previo) => ({ ...previo, productoSolicitudId: producto.id, unidadMedida: producto.unidadMedida || "unidad" }));
    setValidacion((previo) => ({ ...previo, productoSolicitudId: producto.id, unidadMedida: producto.unidadMedida || "unidad" }));
  }, [detalle?.id]);

  useEffect(() => {
    setConfirmarAvance(false);
  }, [detalle?.estado]);

  useEffect(() => {
    if (!exito) return undefined;
    const reloj = window.setTimeout(() => setExito(null), 9000);
    return () => window.clearTimeout(reloj);
  }, [exito]);

  const encargado = puedeTrabajar(detalle, sesion);
  const cerrado = ["COMPLETADA", "RECHAZADA", "CANCELADA"].includes(detalle?.estado);
  const siguiente = detalle ? SIGUIENTE_ESTADO[detalle.estado] : null;

  async function actuar(tarea, opciones = {}) {
    if (!detalle) return;
    const estadoAntes = detalle.estado;
    setOcupado(true);
    setError("");
    try {
      const actual = await tarea();
      if (actual?.id) {
        setDetalle(actual);
        if (actual.estado !== estadoAntes) {
          const texto = `El expediente pasó a ${etiquetaEstado(actual.estado)}.`;
          setExito(texto);
          onTramiteActualizado?.(actual);
          setConfirmarAvance(false);
        } else if (opciones.mensajeExito) {
          setExito(opciones.mensajeExito);
        }
      }
      if (onLista) await onLista();
      avisosActualizados();
    } catch (fallo) {
      setError(textoErrorTrabajo(fallo));
    } finally {
      setOcupado(false);
    }
  }

  function confirmarPaso() {
    if (!siguiente) return;
    actuar(() => solicitar(`/solicitudes/${detalle.id}/estado`, { method: "POST", cuerpo: { estado: siguiente } }));
  }

  if (!detalle) return null;

  return (
    <section className="mesa__expediente-bloque mesa__expediente-bloque--trabajo" id="mesa-trabajo-expediente">
      <header className="mesa__trabajo-cabecera">
        <h3>Trabajar expediente</h3>
        {encargado && detalle.estado ? (
          <span className="mesa__trabajo-etapa">{ESTADOS_TRABAJO[detalle.estado] || detalle.estado}</span>
        ) : null}
      </header>

      {exito ? (
        <p className="mesa__trabajo-exito" role="status">
          {exito}
        </p>
      ) : null}

      {!detalle.asignadaAId ? (
        <p className="mesa__trabajo-aviso">El jefe aún no asigna un responsable. Solo puedes consultar la información.</p>
      ) : null}
      {detalle.asignadaAId && !encargado ? (
        <p className="mesa__trabajo-aviso">
          Este expediente lo trabaja {detalle.asignadaA?.nombre || "la persona asignada"}.
          {(detalle.colaboradores || []).length ? " Puedes ver el avance." : ""}
        </p>
      ) : null}

      {encargado && detalle.estado === "EN_ESPERA" ? (
        <div className="mesa__trabajo-toolbar" role="toolbar" aria-label="Reanudar expediente">
          <p className="mesa__trabajo-toolbar-leyenda">Expediente en pausa</p>
          <button type="button" className="btn btn--naranja btn--chico" disabled={ocupado} onClick={() => actuar(() => solicitar(`/solicitudes/${detalle.id}/reanudar`, { method: "POST" }))}>
            Reanudar trabajo
          </button>
        </div>
      ) : null}

      {encargado && siguiente ? (
        <>
          <GuiaFaseTrabajo
            detalle={detalle}
            confirmando={confirmarAvance}
            ocupado={ocupado}
            onIniciarAvance={() => setConfirmarAvance(true)}
            onCancelarAvance={() => setConfirmarAvance(false)}
            onConfirmarAvance={confirmarPaso}
          />
          <div className="mesa__trabajo-toolbar-secundaria" role="toolbar" aria-label="Otras acciones">
            {PUEDE_PAUSAR.has(detalle.estado) ? (
              <button type="button" className="btn btn--linea btn--chico" disabled={ocupado} onClick={() => actuar(() => solicitar(`/solicitudes/${detalle.id}/pausar`, { method: "POST" }), { mensajeExito: "El expediente quedó en espera." })}>
                Poner en espera
              </button>
            ) : null}
            {!cerrado && detalle.estado !== "PENDIENTE_SUBSANACION" ? (
              <button
                type="button"
                className="btn btn--linea btn--chico mesa__btn-peligro"
                disabled={ocupado}
                onClick={() => {
                  if (!window.confirm("¿Rechazar este expediente? La acción queda registrada.")) return;
                  actuar(() => solicitar(`/solicitudes/${detalle.id}/estado`, { method: "POST", cuerpo: { estado: "RECHAZADA", motivo: "Rechazada desde la bandeja" } }));
                }}
              >
                Rechazar
              </button>
            ) : null}
          </div>
        </>
      ) : null}

      {encargado && !cerrado ? (
        <form
          className="mesa__form mesa__form--observacion"
          onSubmit={(evento) => {
            evento.preventDefault();
            actuar(async () => {
              const actual = await solicitar(`/solicitudes/${detalle.id}/comentarios`, { method: "POST", cuerpo: comentario });
              setComentario({ contenido: "", esInterno: false, devolver: false });
              return actual;
            }, { mensajeExito: comentario.devolver ? "Expediente devuelto a la entidad." : "Observación guardada." });
          }}
        >
          <label className="mesa__campo">
            <span className="mesa__campo-etiqueta">Observación</span>
            <textarea
              value={comentario.contenido}
              onChange={(evento) => setComentario((previo) => ({ ...previo, contenido: evento.target.value }))}
              required
              minLength={1}
              rows={3}
              placeholder="Escribe lo que la entidad o el equipo deben conocer…"
            />
          </label>
          <div className="mesa__trabajo-opciones">
            <label className="mesa__check">
              <input
                type="checkbox"
                checked={comentario.esInterno}
                onChange={(evento) => setComentario((previo) => ({ ...previo, esInterno: evento.target.checked, devolver: evento.target.checked ? false : previo.devolver }))}
              />
              <span>Nota interna</span>
            </label>
            {PUEDE_DEVOLVER.has(detalle.estado) ? (
              <label className="mesa__check">
                <input
                  type="checkbox"
                  checked={comentario.devolver}
                  disabled={comentario.esInterno}
                  onChange={(evento) => setComentario((previo) => ({ ...previo, devolver: evento.target.checked }))}
                />
                <span>Devolver a la entidad</span>
              </label>
            ) : null}
          </div>
          <div className="mesa__trabajo-form-pie">
            <button type="submit" className="btn btn--linea btn--chico" disabled={ocupado}>
              Guardar observación
            </button>
          </div>
        </form>
      ) : null}

      {encargado && PUEDE_BOLETA.has(detalle.estado) ? (
        <>
          {(detalle.consultas || []).length > 0 ? (
            <div className="mesa__trabajo-registros">
              <h4>Boletas registradas</h4>
              <ul>
                {(detalle.consultas || []).map((consulta) => (
                  <li key={consulta.id}>
                    <strong>{consulta.fuente?.nombre || "Fuente"}</strong>
                    <span>{fechaCorta(consulta.fechaConsulta)}</span>
                    <ul>
                      {(consulta.precios || []).map((precio) => (
                        <li key={precio.id}>
                          Q {String(precio.precio)} / {precio.unidadMedida}
                          {(detalle.productos || []).find((p) => p.id === precio.productoSolicitudId)?.nombre
                            ? ` · ${(detalle.productos || []).find((p) => p.id === precio.productoSolicitudId).nombre}`
                            : ""}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mesa__trabajo-aviso mesa__trabajo-aviso--suave">Aún no hay boletas: usa el formulario para registrar precios de mercado.</p>
          )}
          <form
            className="mesa__form mesa__form--bloque mesa__form--grilla"
            onSubmit={(evento) => {
              evento.preventDefault();
              const archivo = evento.currentTarget.archivo?.files?.[0];
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
              }, { mensajeExito: "Boleta de investigación registrada." });
            }}
          >
            <h4>Registrar boleta</h4>
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
              <input value={boleta.precio} onChange={(evento) => setBoleta((previo) => ({ ...previo, precio: evento.target.value }))} inputMode="decimal" required />
            </label>
            <label>
              PDF (opcional)
              <input name="archivo" type="file" accept="application/pdf,.pdf" />
            </label>
            <div className="mesa__trabajo-form-pie mesa__trabajo-form-pie--ancho">
              <button type="submit" className="btn btn--linea btn--chico" disabled={ocupado || !fuentes.length}>
                Registrar boleta
              </button>
            </div>
          </form>
        </>
      ) : null}

      {encargado && detalle.estado === "EN_ANALISIS" ? (
        <>
          {(detalle.validaciones || []).length > 0 ? (
            <ul className="mesa__trabajo-validaciones">
              {(detalle.validaciones || []).map((item) => (
                <li key={item.id} className={item.confirmada ? "es-confirmada" : ""}>
                  {(detalle.productos || []).find((p) => p.id === item.productoSolicitudId)?.nombre || "Producto"}
                  {" · "}
                  {item.confirmada ? "Confirmado" : "Borrador"}: Q {String(item.precioAdoptado)}
                </li>
              ))}
            </ul>
          ) : null}
          <form
            className="mesa__form mesa__form--bloque"
            onSubmit={(evento) => {
              evento.preventDefault();
              actuar(() => solicitar(`/solicitudes/${detalle.id}/validaciones`, {
                method: "POST",
                cuerpo: { ...validacion, moneda: "GTQ", confirmar: true },
              }), { mensajeExito: "Precio de referencia confirmado para el producto." });
            }}
          >
            <h4>Precio confirmado</h4>
            <label>
              Producto
              <select
                value={validacion.productoSolicitudId}
                onChange={(evento) => {
                  const producto = (detalle.productos || []).find((p) => p.id === evento.target.value);
                  setValidacion((previo) => ({
                    ...previo,
                    productoSolicitudId: evento.target.value,
                    unidadMedida: producto?.unidadMedida || previo.unidadMedida,
                  }));
                }}
              >
                {(detalle.productos || []).map((producto) => <option key={producto.id} value={producto.id}>{producto.nombre}</option>)}
              </select>
            </label>
            <label>
              Precio adoptado
              <input value={validacion.precioAdoptado} onChange={(evento) => setValidacion((previo) => ({ ...previo, precioAdoptado: evento.target.value }))} required />
            </label>
            <label>
              Criterio
              <textarea value={validacion.criterio} onChange={(evento) => setValidacion((previo) => ({ ...previo, criterio: evento.target.value }))} required minLength={3} rows={2} />
            </label>
            <div className="mesa__trabajo-form-pie mesa__trabajo-form-pie--ancho">
              <button type="submit" className="btn btn--naranja btn--chico" disabled={ocupado}>
                Confirmar precio
              </button>
            </div>
          </form>
        </>
      ) : null}

      {encargado && detalle.estado === "EN_INFORME" ? (
        <div className="mesa__form mesa__form--bloque">
          <h4>Documento del expediente</h4>
          <p className="mesa__fase-objetivo">Prepara el borrador con destinatario y emítelo cuando el texto esté listo.</p>
          {(detalle.informes || []).map((item) => (
            <article key={item.id} className="mesa__trabajo-informe">
              <strong>{item.tipo} v{item.version} · {item.estado}</strong>
              <p>{item.destinatario}</p>
              {item.resumen ? <p className="mesa__trabajo-informe-resumen">{item.resumen}</p> : null}
              {item.estado !== "EMITIDO" ? (
                <button
                  type="button"
                  className="btn btn--naranja btn--chico"
                  disabled={ocupado}
                  onClick={() => actuar(() => solicitar(`/solicitudes/${detalle.id}/informes/${item.id}/emitir`, { method: "POST" }), { mensajeExito: "Informe emitido correctamente." })}
                >
                  Emitir informe
                </button>
              ) : null}
            </article>
          ))}
          <form
            onSubmit={(evento) => {
              evento.preventDefault();
              actuar(() => solicitar(`/solicitudes/${detalle.id}/informes`, {
                method: "POST",
                cuerpo: { tipo: "INFORME_TECNICO", destinatario: informe.destinatario },
              }), { mensajeExito: "Borrador de informe creado." });
            }}
          >
            <label>
              Destinatario del informe
              <input value={informe.destinatario} onChange={(evento) => setInforme((previo) => ({ ...previo, destinatario: evento.target.value }))} required minLength={3} placeholder="Nombre o cargo del destinatario" />
            </label>
            <div className="mesa__trabajo-form-pie mesa__trabajo-form-pie--ancho">
              <button type="submit" className="btn btn--linea btn--chico" disabled={ocupado}>
                Preparar borrador
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {encargado && detalle.estado === "EN_ENTREGA" ? (
        <>
          {(detalle.entregas || []).length > 0 ? (
            <ul className="mesa__trabajo-validaciones">
              {(detalle.entregas || []).map((item) => (
                <li key={item.id} className="es-confirmada">
                  {item.medio} · {item.destinatario} · {fechaCorta(item.fechaEntrega)}
                </li>
              ))}
            </ul>
          ) : null}
          <form
            className="mesa__form mesa__form--bloque mesa__form--grilla"
            onSubmit={(evento) => {
              evento.preventDefault();
              const archivo = evento.currentTarget.archivo?.files?.[0];
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
                formulario.reset();
                return actual;
              }, { mensajeExito: "Entrega registrada en el expediente." });
            }}
          >
            <h4>Registrar entrega</h4>
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
              <textarea value={entrega.constancia} onChange={(evento) => setEntrega((previo) => ({ ...previo, constancia: evento.target.value }))} required minLength={3} rows={2} />
            </label>
            <label>
              PDF constancia (opcional)
              <input name="archivo" type="file" accept="application/pdf,.pdf" />
            </label>
            <div className="mesa__trabajo-form-pie mesa__trabajo-form-pie--ancho">
              <button type="submit" className="btn btn--naranja btn--chico" disabled={ocupado}>
                Registrar entrega
              </button>
            </div>
          </form>
        </>
      ) : null}
    </section>
  );
}