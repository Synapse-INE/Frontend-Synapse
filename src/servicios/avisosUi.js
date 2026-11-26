/** Pide a la campana del encabezado que vuelva a cargar avisos. */
export function avisosActualizados() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("dpir:avisos"));
}