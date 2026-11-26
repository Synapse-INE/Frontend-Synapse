function plural(n) {
  const cantidad = Math.abs(n);
  return `${cantidad} ${cantidad === 1 ? "día" : "días"}`;
}

export function textoAtencion(atencion) {
  if (!atencion) return "";
  const fecha = atencion.venceEn;
  if (atencion.situacion === "EN_SUBSANACION") {
    if (atencion.diasRestantes < 0) {
      return "El tiempo de atención ya se había cumplido y sigue detenido mientras se corrige.";
    }
    return `El tiempo de atención está detenido mientras se corrige. Quedan ${plural(atencion.diasRestantes)} · hasta ${fecha}.`;
  }
  if (atencion.situacion === "VENCE_HOY") return `El tiempo de atención vence hoy (${fecha}).`;
  if (atencion.situacion === "VENCIDA") {
    return `El tiempo de atención venció hace ${plural(atencion.diasRestantes)}. Era el ${fecha}.`;
  }
  if (atencion.situacion === "ATENDIDA") return "Se atendió dentro de los 15 días.";
  if (atencion.situacion === "ATENDIDA_FUERA_DE_PLAZO") return "Se atendió fuera de los 15 días.";
  return `Tiempo de atención: quedan ${plural(atencion.diasRestantes)} · hasta ${fecha}.`;
}

export function MarcaAtencion({ atencion }) {
  if (!atencion) return null;
  const vencida = atencion.situacion === "VENCIDA" || atencion.situacion === "ATENDIDA_FUERA_DE_PLAZO" || atencion.situacion === "VENCE_HOY";
  return <small className={vencida ? "atencion atencion--vencida" : "atencion"}>{textoAtencion(atencion)}</small>;
}
