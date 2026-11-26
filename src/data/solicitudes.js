const CLAVE = "dpir.solicitudes";

export const ESTADOS_SOLICITUD = {
  recibida: "Recibida",
  en_revision: "En revisión",
  en_analisis: "En análisis",
  informe_listo: "Informe listo",
  entregada: "Entregada",
};

function leer() {
  try {
    const lista = JSON.parse(localStorage.getItem(CLAVE) || "[]");
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

export function leerSolicitudes() {
  return leer();
}

export function guardarSolicitud(solicitud) {
  const lista = leer();
  lista.unshift(solicitud);
  localStorage.setItem(CLAVE, JSON.stringify(lista.slice(0, 100)));
  return solicitud;
}

export function numeroSeguimiento(total) {
  return `DPIR-${new Date().getFullYear()}-${String(total).padStart(4, "0")}`;
}
