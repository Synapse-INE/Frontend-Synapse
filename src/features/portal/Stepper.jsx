import { fechaDia } from "./formato";

// Ruta de avance. `actual` es el índice del paso en curso; si es el último, queda completado.
// `fechas[i]` es la fecha (ISO) en que se llegó a cada paso ya alcanzado.
export function Stepper({ pasos, actual, fechas = [] }) {
  const ultimo = pasos.length - 1;
  return (
    <ol className="riel" aria-label="Progreso de la solicitud">
      {pasos.map((paso, i) => {
        const estado = i < actual || actual >= ultimo ? "hecho" : i === actual ? "actual" : "pendiente";
        const texto = { hecho: "completado", actual: "paso actual", pendiente: "pendiente" }[estado];
        return (
          <li
            key={paso.id}
            className={`riel__paso riel__paso--${estado}`}
            aria-current={estado === "actual" ? "step" : undefined}
          >
            <span className="riel__marca" aria-hidden="true" />
            <span className="riel__titulo">{paso.titulo}</span>
            <span className="riel__fecha">{fechaDia(fechas[i]) || " "}</span>
            <span className="portal-sr">{texto}</span>
          </li>
        );
      })}
    </ol>
  );
}
