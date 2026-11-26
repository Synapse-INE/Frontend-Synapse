import { indiceActivo, PASOS_EXPEDIENTE, resumenProgresoExpediente } from "../solicitud/PasosExpediente";
import { ESTADOS_TRABAJO, SIGUIENTE_ESTADO } from "./expedienteTrabajoUtil";
import {
  advertenciasAvance,
  bloqueoAvance,
  guiaActual,
  requisitosDeFase,
} from "./expedienteGuiaFase";

function etiquetaAvance(estado) {
  const texto = ESTADOS_TRABAJO[estado] || estado;
  return texto.replace(/^En /i, "").toLowerCase();
}

export function GuiaFaseTrabajo({ detalle, confirmando, onIniciarAvance, onCancelarAvance, onConfirmarAvance, ocupado, accionAvance }) {
  const estado = detalle?.estado;
  const guia = guiaActual(detalle);
  const siguiente = SIGUIENTE_ESTADO[estado];
  const requisitos = requisitosDeFase(detalle);
  const bloqueo = bloqueoAvance(detalle);
  const advertencias = advertenciasAvance(detalle);
  const activo = indiceActivo(estado, detalle?.historial);
  const total = PASOS_EXPEDIENTE.length;
  const pasoActual = Math.min(activo + 1, total);
  const listos = requisitos.filter((item) => item.listo).length;

  if (!guia || estado === "EN_ESPERA") return null;

  return (
    <div className="mesa__fase-guia">
      <div className="mesa__fase-progreso" role="status" aria-live="polite">
        <div className="mesa__fase-progreso-texto">
          <strong>{resumenProgresoExpediente(estado, detalle.historial) || `Etapa: ${ESTADOS_TRABAJO[estado]}`}</strong>
          <span>{listos}/{requisitos.length} tareas de esta etapa</span>
        </div>
        <div className="avance" aria-hidden="true">
          <span className="avance__barra">
            {PASOS_EXPEDIENTE.map(([, etiqueta], indice) => (
              <span
                key={etiqueta}
                className={`avance__seg${
                  estado === "COMPLETADA" || indice < activo
                    ? " avance__seg--hecho"
                    : indice === activo
                      ? " avance__seg--actual"
                      : ""
                }`}
                title={etiqueta}
              />
            ))}
          </span>
          <span className="avance__txt">{pasoActual}/{total}</span>
        </div>
      </div>

      <div className="mesa__fase-cuerpo">
        <h4 className="mesa__fase-titulo">{guia.titulo}</h4>
        <p className="mesa__fase-objetivo">{guia.objetivo}</p>

        {requisitos.length > 0 ? (
          <ul className="mesa__fase-checklist">
            {requisitos.map((item) => (
              <li key={item.id} className={item.listo ? "es-listo" : "es-pendiente"}>
                <span className="mesa__fase-check" aria-hidden="true">{item.listo ? "✓" : "○"}</span>
                <span>{item.texto}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {siguiente && guia.alAvanzar ? (
          <p className="mesa__fase-siguiente">
            <span>Al avanzar:</span> {guia.alAvanzar}
          </p>
        ) : null}
      </div>

      {siguiente ? (
        <div className="mesa__fase-acciones">
          {!confirmando ? (
            <button
              type="button"
              className="btn btn--naranja btn--chico"
              disabled={ocupado || Boolean(bloqueo)}
              title={bloqueo || undefined}
              onClick={onIniciarAvance}
            >
              Avanzar a {etiquetaAvance(siguiente)}
            </button>
          ) : (
            <div className="mesa__fase-confirmar">
              <p className="mesa__fase-confirmar-texto">
                ¿Confirmas el pase a <strong>{ESTADOS_TRABAJO[siguiente]}</strong>?
                {accionAvance ? ` ${accionAvance}` : " Quedará registrado en el historial y se notificará a quien corresponda."}
              </p>
              {advertencias.map((texto) => (
                <p key={texto} className="mesa__fase-advertencia">{texto}</p>
              ))}
              <div className="mesa__fase-confirmar-botones">
                <button type="button" className="btn btn--naranja btn--chico" disabled={ocupado} onClick={onConfirmarAvance}>
                  {ocupado ? "Guardando…" : "Sí, avanzar etapa"}
                </button>
                <button type="button" className="btn btn--linea btn--chico" disabled={ocupado} onClick={onCancelarAvance}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
          {bloqueo && !confirmando ? <p className="mesa__fase-bloqueo">{bloqueo}</p> : null}
        </div>
      ) : null}
    </div>
  );
}