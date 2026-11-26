export const PASOS_EXPEDIENTE = [
  ["RECIBIDA", "Recibida"],
  ["EN_REVISION", "En revisión"],
  ["EN_INVESTIGACION", "Investigación"],
  ["EN_ANALISIS", "Análisis"],
  ["EN_INFORME", "Informe"],
  ["EN_ENTREGA", "Entrega"],
  ["COMPLETADA", "Completada"],
];

const PASOS = PASOS_EXPEDIENTE;

const AVISOS = {
  PENDIENTE_SUBSANACION: "Devuelta a la entidad para corrección.",
  EN_ESPERA: "En espera del INE. No está devuelta a la entidad.",
  RECHAZADA: "Rechazada.",
  CANCELADA: "Anulada por quien la solicitó.",
};

const ORDEN = PASOS.map(([codigo]) => codigo);

function responsableDe(historial, estado) {
  const eventos = (historial || []).filter((evento) => evento.estadoNuevo === estado);
  return eventos.at(-1) || null;
}

export function indiceActivo(estado, historial) {
  if (estado === "COMPLETADA") return ORDEN.length;
  if (estado === "RECHAZADA" || estado === "CANCELADA") return -1;
  if (estado === "PENDIENTE_SUBSANACION") {
    return Math.max(0, ORDEN.indexOf("EN_REVISION"));
  }
  if (estado === "EN_ESPERA") {
    const ultimo = [...(historial || [])].reverse().find((evento) => evento.estadoNuevo && ORDEN.includes(evento.estadoNuevo));
    const indice = ORDEN.indexOf(ultimo?.estadoNuevo || "RECIBIDA");
    return indice >= 0 ? indice : 0;
  }
  if (estado === "BORRADOR") return -1;
  const indice = ORDEN.indexOf(estado);
  return indice >= 0 ? indice : 0;
}

export function resumenProgresoExpediente(estado, historial) {
  if (["RECHAZADA", "CANCELADA", "BORRADOR"].includes(estado)) return null;
  const activo = indiceActivo(estado, historial);
  if (activo < 0) return null;
  const paso = Math.min(activo + 1, PASOS.length);
  const etiqueta = estado === "COMPLETADA" ? "Completada" : (PASOS[activo]?.[1] || estado);
  return `Paso ${paso} de ${PASOS.length} · ${etiqueta}`;
}

const CLASES_VARIANTE = {
  linea: "expediente__pasos expediente__pasos--linea",
  cuadricula: "expediente__pasos expediente__pasos--cuadricula",
  franja: "expediente__pasos expediente__pasos--franja",
  columna: "expediente__pasos expediente__pasos--columna",
  ficha: "expediente__pasos",
};

export function PasosExpediente({ estado, historial, variante = "ficha", revision = 0 }) {
  const activo = indiceActivo(estado, historial);
  const clases = CLASES_VARIANTE[variante] || CLASES_VARIANTE.ficha;
  const compacto = variante === "cuadricula" || variante === "franja" || variante === "columna";

  return (
    <div className={`expediente__avance${revision ? " expediente__avance--actualizado" : ""}`} key={`avance-${revision}-${estado}`}>
      {AVISOS[estado] ? <p className="expediente__aviso">{AVISOS[estado]}</p> : null}
      <ol className={clases} aria-label="Avance del expediente">
        {PASOS.map(([codigo, etiqueta], indice) => {
          const evento = responsableDe(historial, codigo);
          const pasoActual = indice === activo && !["COMPLETADA", "RECHAZADA", "CANCELADA"].includes(estado);
          const hecho = estado === "COMPLETADA" || indice < activo;
          const clase = [
            "expediente__paso",
            hecho ? "expediente__paso--hecho" : "",
            pasoActual ? "expediente__paso--actual" : "",
          ].filter(Boolean).join(" ");

          let pie = "Pendiente";
          if (compacto) {
            if (pasoActual) pie = "Ahora";
            else if (hecho) pie = "Listo";
            else pie = "—";
          } else if (hecho && evento?.actor?.nombre) {
            pie = evento.actor.nombre;
          } else if (pasoActual) {
            pie = evento?.actor?.nombre || "En este paso";
          } else if (hecho) {
            pie = "Completado";
          }

          const titulo = variante === "franja" && etiqueta.length > 12
            ? etiqueta.replace("En ", "").replace(" electrónica", "")
            : etiqueta;

          return (
            <li key={codigo} className={clase} title={etiqueta}>
              <span className="expediente__paso-n" aria-hidden="true">{indice + 1}</span>
              <strong>{titulo}</strong>
              {variante === "columna" ? (
                pasoActual ? <small className="expediente__paso-estado">Ahora</small> : hecho ? <small className="expediente__paso-estado">Listo</small> : null
              ) : variante !== "franja" ? (
                <small>{pie}</small>
              ) : pasoActual ? (
                <small>{pie}</small>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}