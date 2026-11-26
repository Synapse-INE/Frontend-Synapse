const CERRADOS = new Set(["COMPLETADA", "RECHAZADA", "CANCELADA"]);

export const GRUPOS = [
  { id: "sin", titulo: "Sin asignar", ayuda: "Nadie es responsable todavía.", tono: "orange" },
  { id: "venc", titulo: "Vencidas y por vencer", ayuda: "El tiempo de atención ya se cumplió o queda en 2 días o menos.", tono: "red" },
  { id: "corr", titulo: "En corrección", ayuda: "La entidad tiene que completar la solicitud. El tiempo está detenido.", tono: "amber" },
  { id: "espera", titulo: "En espera", ayuda: "El INE pausó el expediente. El tiempo de atención sigue corriendo.", tono: "amber" },
  { id: "curso", titulo: "En curso", ayuda: "Ya tienen trabajador y siguen dentro del tiempo.", tono: "blue" },
];

export function grupoDe(solicitud) {
  if (!solicitud || CERRADOS.has(solicitud.estado)) return null;
  if (!solicitud.asignadaAId) return "sin";
  if (solicitud.estado === "PENDIENTE_SUBSANACION") return "corr";
  if (solicitud.estado === "EN_ESPERA") return "espera";
  const dias = solicitud.atencion?.diasRestantes;
  const situacion = solicitud.atencion?.situacion;
  if (situacion === "VENCIDA" || situacion === "VENCE_HOY" || (typeof dias === "number" && dias <= 2)) return "venc";
  return "curso";
}

export function motivoDe(solicitud) {
  const grupo = grupoDe(solicitud);
  if (!grupo) return "";
  if (grupo === "sin") return "Sin responsable";
  if (grupo === "corr") return "Esperando a la entidad";
  if (grupo === "espera") return "Pausada por el INE";
  if (grupo === "venc") {
    const dias = solicitud.atencion?.diasRestantes;
    if (dias < 0) return `Venció hace ${Math.abs(dias)} d`;
    if (dias === 0) return "Vence hoy";
    return `Vence en ${dias} d`;
  }
  if (solicitud.atencion?.diasRestantes != null) return `Quedan ${solicitud.atencion.diasRestantes} d`;
  return "En curso";
}

export function accionDe(solicitud) {
  return grupoDe(solicitud) === "sin" ? "Asignar" : "Abrir";
}

export function tituloGrupo(grupo) {
  if (!grupo) return "";
  return GRUPOS.find((item) => item.id === grupo)?.titulo || "";
}
