import { grupoDe } from "./grupos";

const CERRADOS = new Set(["COMPLETADA", "RECHAZADA", "CANCELADA"]);

export const CORTES_TRABAJADOR = [
  {
    id: "mias",
    titulo: "A mi cargo",
    nota: "Eres el responsable",
    tono: "azul",
    icono: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  },
  {
    id: "apoyo",
    titulo: "Apoyo",
    nota: "Colaboras en el expediente",
    tono: "naranja",
    icono: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 8v6M22 11h-6",
  },
  {
    id: "venc",
    titulo: "Por vencer",
    nota: "Plazo cumplido o a dos días",
    tono: "rojo",
    icono: "M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  },
  {
    id: "cerradas",
    titulo: "Cerradas",
    nota: "Completadas o anuladas",
    tono: "lima",
    icono: "M20 7 9 18l-5-5",
  },
];

export const GRUPOS_TRABAJADOR = [
  { id: "mias", titulo: "A mi cargo", ayuda: "Expedientes donde eres responsable.", tono: "blue" },
  { id: "apoyo", titulo: "Como apoyo", ayuda: "Acompañas al responsable principal.", tono: "orange" },
];

export function colaboraEn(solicitud, usuarioId) {
  if (!usuarioId || !solicitud) return false;
  return (solicitud.colaboradores || []).some(
    (item) => item.usuarioId === usuarioId || item.usuario?.id === usuarioId,
  );
}

export function involucra(solicitud, usuarioId) {
  if (!usuarioId || !solicitud) return false;
  return solicitud.asignadaAId === usuarioId || colaboraEn(solicitud, usuarioId);
}

export function entraEnCorteTrabajador(solicitud, corte, usuarioId) {
  if (corte === "mias") {
    return solicitud.asignadaAId === usuarioId && Boolean(grupoDe(solicitud));
  }
  if (corte === "apoyo") {
    return colaboraEn(solicitud, usuarioId) && solicitud.asignadaAId !== usuarioId && Boolean(grupoDe(solicitud));
  }
  if (corte === "venc") return grupoDe(solicitud) === "venc" && involucra(solicitud, usuarioId);
  if (corte === "cerradas") return CERRADOS.has(solicitud.estado) && involucra(solicitud, usuarioId);
  return true;
}

export function accionDeTrabajador(solicitud, usuarioId) {
  if (!involucra(solicitud, usuarioId)) return "Ver";
  if (!solicitud.asignadaAId) return "Ver";
  return "Trabajar";
}