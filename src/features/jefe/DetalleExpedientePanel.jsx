import { useEffect, useRef, useState } from "react";
import { formatearFecha } from "../../data/precios";
import { descargarArchivo } from "../../servicios/api";
import { textoAtencion } from "../solicitud/Atencion";
import { PasosExpediente } from "../solicitud/PasosExpediente";
import { grupoDe, motivoDe, tituloGrupo } from "./grupos";
import { PanelTrabajoExpediente } from "./PanelTrabajoExpediente";
import { puedeTrabajar } from "./expedienteTrabajoUtil";

const MODALIDAD = {
  CONTRATO_ABIERTO: "Contrato abierto",
  SUBASTA_ELECTRONICA_INVERSA: "Subasta electrónica inversa",
  BIENES_SUMINISTROS_IMPORTADOS: "Bienes importados",
};

const ICONOS = {
  envio: "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z",
  modalidad: "M4 6h16M4 12h16M4 18h10",
  productos: "M21 8 12 3 3 8v8l9 5 9-5V8ZM3 8l9 5 9-5M12 13v8",
  situacion: "M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  pdf: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6ZM14 2v6h6",
  descarga: "M12 3v12M7 10l5 5 5-5M5 21h14",
};

function Icono({ d, size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function fechaLarga(valor) {
  if (!valor) return "—";
  const texto = typeof valor === "string" ? valor.slice(0, 10) : valor;
  return formatearFecha(texto);
}

export function DetalleExpedientePanel({
  detalle,
  adjuntos,
  esJefe,
  sesion,
  cerrado,
  responsable,
  setResponsable,
  apoyo,
  setApoyo,
  personal,
  apoyoDisponible,
  ocupado,
  asignar,
  agregarApoyo,
  quitarApoyo,
  iniciales,
  setDetalle,
  setError,
  onLista,
}) {
  const [senalAvance, setSenalAvance] = useState(0);
  const avanceRef = useRef(null);

  useEffect(() => {
    if (!senalAvance) return undefined;
    avanceRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    const reloj = window.setTimeout(() => setSenalAvance(0), 2400);
    return () => window.clearTimeout(reloj);
  }, [senalAvance]);

  if (!detalle) return null;

  const grupo = grupoDe(detalle);
  const puedeTrabajarExp = puedeTrabajar(detalle, sesion);
  const ultimoHistorial = (detalle.historial || []).at(-1)?.id;
  const vencida = ["VENCIDA", "VENCE_HOY", "ATENDIDA_FUERA_DE_PLAZO"].includes(detalle.atencion?.situacion);

  const meta = [
    { icono: ICONOS.envio, etiqueta: "Enviada", valor: fechaLarga(detalle.enviadaEn || detalle.createdAt) },
    { icono: ICONOS.modalidad, etiqueta: "Modalidad", valor: MODALIDAD[detalle.modalidad] || detalle.modalidad || "—" },
    { icono: ICONOS.productos, etiqueta: "Productos", valor: detalle.productos?.length ?? 0 },
  ];
  if (grupo) meta.push({ icono: ICONOS.situacion, etiqueta: "Situación", valor: motivoDe(detalle) || tituloGrupo(grupo) });

  return (
    <div className="mesa__expediente-cuerpo">
      {detalle.atencion ? (
        <p className={`mesa__plazo-banda${vencida ? " es-vencida" : ""}`}>{textoAtencion(detalle.atencion)}</p>
      ) : null}

      <div className="mesa__expediente-meta-grid">
        {meta.map((item) => (
          <div key={item.etiqueta} className="mesa__expediente-meta-item">
            <i aria-hidden="true"><Icono d={item.icono} /></i>
            <div>
              <span>{item.etiqueta}</span>
              <strong>{item.valor}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="mesa__expediente-layout mesa__expediente-layout--detalle">
        <section
          ref={avanceRef}
          id="mesa-avance-tramite"
          className={`mesa__expediente-panel mesa__expediente-panel--avance${senalAvance ? " mesa__avance--pulso" : ""}`}
        >
          <h3>Avance del trámite</h3>
          <PasosExpediente estado={detalle.estado} historial={detalle.historial} variante="columna" revision={senalAvance} />
        </section>
        <section className="mesa__expediente-panel mesa__expediente-panel--equipo">
          <h3>Equipo de trabajo</h3>
          <div className="mesa__equipo">
            <div className="mesa__equipo-seccion">
              <h4>Responsable</h4>
              <p className="mesa__responsable">
                <i aria-hidden="true" className={detalle.asignadaA ? "" : "es-vacio"}>{detalle.asignadaA ? iniciales(detalle.asignadaA.nombre) : "?"}</i>
                <span>{detalle.asignadaA?.nombre || "Sin trabajador asignado"}</span>
              </p>
              {esJefe && !cerrado ? (
                <form className="mesa__form mesa__form--compact" onSubmit={asignar}>
                  <label>
                    Asignar trabajador
                    <select value={responsable} onChange={(evento) => setResponsable(evento.target.value)} required>
                      <option value="">Selecciona</option>
                      {personal.map((persona) => <option key={persona.id} value={persona.id}>{persona.nombre}</option>)}
                    </select>
                  </label>
                  <button className="btn btn--naranja btn--chico" type="submit" disabled={ocupado || personal.length === 0}>
                    Asignar
                  </button>
                  {personal.length === 0 ? <small className="mesa__form-nota">No hay trabajadores activos.</small> : null}
                </form>
              ) : null}
            </div>
            <div className="mesa__equipo-seccion">
              <h4>Apoyo</h4>
              {(detalle.colaboradores || []).length === 0 ? (
                <p className="mesa__equipo-vacio">Nadie más acompaña este expediente.</p>
              ) : (
                <ul className="mesa__apoyos">
                  {detalle.colaboradores.map((item) => (
                    <li key={item.usuario.id}>
                      <span><i aria-hidden="true">{iniciales(item.usuario.nombre)}</i>{item.usuario.nombre}</span>
                      {esJefe && !cerrado ? (
                        <button type="button" onClick={() => quitarApoyo(item.usuario.id)} disabled={ocupado}>Quitar</button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
              {esJefe && !cerrado ? (
                <form className="mesa__form mesa__form--compact" onSubmit={agregarApoyo}>
                  <label>
                    Sumar apoyo
                    <select value={apoyo} onChange={(evento) => setApoyo(evento.target.value)} required>
                      <option value="">Selecciona</option>
                      {apoyoDisponible.map((persona) => <option key={persona.id} value={persona.id}>{persona.nombre}</option>)}
                    </select>
                  </label>
                  <button className="btn btn--linea btn--chico" type="submit" disabled={ocupado || apoyoDisponible.length === 0}>
                    Agregar
                  </button>
                </form>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      <section className="mesa__expediente-bloque">
        <h3>Productos solicitados</h3>
        {(detalle.productos || []).length === 0 ? <p className="mesa__equipo-vacio">Sin productos.</p> : (
          <ul className="mesa__productos">
            {(detalle.productos || []).map((producto) => (
              <li key={producto.id}>
                <b>{producto.numero}</b>
                <span className="mesa__producto-nombre">{producto.nombre}</span>
                <span className="mesa__producto-cantidad">
                  {producto.cantidad ?? "—"} <small>{producto.unidadMedida}</small>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(detalle.historial || []).length > 0 ? (
        <section className="mesa__expediente-bloque mesa__expediente-bloque--historial">
          <h3>Últimos movimientos</h3>
          <ol className="mesa__historial">
            {(detalle.historial || []).slice(-6).reverse().map((evento) => (
              <li key={evento.id} className={evento.id === ultimoHistorial ? "mesa__historial--nuevo" : ""}>
                <div className="mesa__historial-cabeza">
                  <span className="mesa__historial-accion">{evento.accion}</span>
                  {evento.createdAt ? (
                    <time className="mesa__historial-fecha" dateTime={evento.createdAt}>{fechaLarga(evento.createdAt)}</time>
                  ) : null}
                </div>
                {evento.detalle ? <span className="mesa__historial-detalle">{evento.detalle}</span> : null}
                {evento.actor?.nombre ? <span className="mesa__historial-actor">{evento.actor.nombre}</span> : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <div className="mesa__expediente-fichas">
        <section className="mesa__expediente-bloque">
          <h3>Observaciones</h3>
          {(detalle.comentarios || []).length === 0 ? <p className="mesa__equipo-vacio">Sin observaciones.</p> : (
            <ul className="mesa__notas">
              {detalle.comentarios.map((nota) => (
                <li key={nota.id} className={nota.esInterno ? "es-interna" : ""}>
                  <i aria-hidden="true">{iniciales(nota.autor?.nombre)}</i>
                  <div>
                    <strong>
                      {nota.autor?.nombre || "Participante"}
                      {nota.esInterno ? <em>Interna</em> : null}
                      {nota.createdAt ? <time>{fechaLarga(nota.createdAt)}</time> : null}
                    </strong>
                    <span>{nota.contenido}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="mesa__expediente-bloque">
          <h3>Archivos</h3>
          {adjuntos.length === 0 ? <p className="mesa__equipo-vacio">Este expediente no tiene PDF.</p> : (
            <ul className="mesa__archivos">
              {adjuntos.map((archivo) => (
                <li key={archivo.id}>
                  <button
                    type="button"
                    onClick={() => descargarArchivo(`/solicitudes/${detalle.id}/adjuntos/${archivo.id}`, archivo.nombreOriginal).catch((err) => setError(err.message))}
                  >
                    <i aria-hidden="true"><Icono d={ICONOS.pdf} /></i>
                    <span>{archivo.nombreOriginal}</span>
                    <Icono d={ICONOS.descarga} size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {puedeTrabajarExp ? (
        <PanelTrabajoExpediente
          detalle={detalle}
          setDetalle={setDetalle}
          setError={setError}
          onLista={onLista}
          onTramiteActualizado={() => setSenalAvance((n) => n + 1)}
        />
      ) : null}
    </div>
  );
}
