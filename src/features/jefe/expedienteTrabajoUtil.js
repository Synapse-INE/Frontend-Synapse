import { ApiError } from "../../servicios/api";

export const ESTADOS_TRABAJO = {
  RECIBIDA: "Recibida",
  EN_REVISION: "En revisión",
  PENDIENTE_SUBSANACION: "En corrección",
  EN_INVESTIGACION: "En investigación",
  EN_ANALISIS: "En análisis",
  EN_INFORME: "En informe",
  EN_ENTREGA: "En entrega",
  COMPLETADA: "Completada",
  RECHAZADA: "Rechazada",
  EN_ESPERA: "En espera",
  CANCELADA: "Anulada",
};

export const SIGUIENTE_ESTADO = {
  RECIBIDA: "EN_REVISION",
  EN_REVISION: "EN_INVESTIGACION",
  EN_INVESTIGACION: "EN_ANALISIS",
  EN_ANALISIS: "EN_INFORME",
  EN_INFORME: "EN_ENTREGA",
  EN_ENTREGA: "COMPLETADA",
};

export const PUEDE_DEVOLVER = new Set(["EN_REVISION", "EN_INVESTIGACION", "EN_ANALISIS"]);
export const PUEDE_BOLETA = new Set(["EN_INVESTIGACION", "EN_ANALISIS"]);
export const PUEDE_PAUSAR = new Set(["RECIBIDA", "EN_REVISION", "EN_INVESTIGACION", "EN_ANALISIS", "EN_INFORME", "EN_ENTREGA"]);

export function pdfValido(archivo) {
  return archivo && archivo.size <= 10 * 1024 * 1024 && archivo.name.toLowerCase().endsWith(".pdf");
}

export function puedeTrabajar(detalle, sesion) {
  if (!detalle) return false;
  if (sesion?.rol === "admin") return true;
  if (!detalle.asignadaAId) return false;
  if (detalle.asignadaAId === sesion?.id) return true;
  return (detalle.colaboradores || []).some((item) => item.usuario?.id === sesion?.id);
}

export function textoErrorTrabajo(fallo) {
  if (fallo instanceof ApiError) return fallo.errors?.[0]?.message || fallo.message || fallo.detail;
  return "No se pudo completar la acción.";
}

export function fechaCorta(valor) {
  if (!valor) return "";
  return String(valor).slice(0, 10);
}