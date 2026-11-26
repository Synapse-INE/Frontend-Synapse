import { useEffect, useState } from "react";
import { useSesion } from "../../sesion/Sesion";
import { solicitar } from "../../servicios/api";
import { avisosActualizados } from "../../servicios/avisosUi";
import { AnalisisExpediente } from "./AnalisisExpediente";
import { BoletasInvestigacion } from "./BoletasInvestigacion";
import { InformeExpediente } from "./InformeExpediente";
import { EntregaExpediente } from "./EntregaExpediente";
import { GuiaFaseTrabajo } from "./GuiaFaseTrabajo";
import {
  ESTADOS_TRABAJO,
  PUEDE_BOLETA,
  PUEDE_DEVOLVER,
  PUEDE_PAUSAR,
  SIGUIENTE_ESTADO,
  puedeTrabajar,
  textoErrorTrabajo,
} from "./expedienteTrabajoUtil";
import { etiquetaEstado } from "./expedienteGuiaFase";

export function PanelTrabajoExpediente({ detalle, setDetalle, setError, onLista, onTramiteActualizado }) {
  const { sesion } = useSesion();
  const [fuentes, setFuentes] = useState([]);
  const [comentario, setComentario] = useState({ contenido: "", esInterno: false, devolver: false });
  const [ocupado, setOcupado] = useState(false);
  const [confirmarAvance, setConfirmarAvance] = useState(false);
  const [exito, setExito] = useState(null);

  useEffect(() => {
    solicitar("/fuentes-consulta?soloActivas=true")
      .then((origenes) => setFuentes(Array.isArray(origenes) ? origenes : []))
      .catch(() => setFuentes([]));
  }, []);

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

      {encargado && PUEDE_BOLETA.has(detalle.estado) ? (
        <BoletasInvestigacion
          detalle={detalle}
          fuentes={fuentes}
          ocupado={ocupado}
          setError={setError}
          actuar={actuar}
        />
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

      {encargado && detalle.estado === "EN_ANALISIS" ? (
        <AnalisisExpediente detalle={detalle} ocupado={ocupado} actuar={actuar} />
      ) : null}

      {encargado && detalle.estado === "EN_INFORME" ? (
        <InformeExpediente detalle={detalle} ocupado={ocupado} setError={setError} actuar={actuar} />
      ) : null}

      {encargado && detalle.estado === "EN_ENTREGA" ? (
        <EntregaExpediente detalle={detalle} ocupado={ocupado} setError={setError} actuar={actuar} />
      ) : null}
    </section>
  );
}
