// Cálculo de plazos y de qué solicitudes necesitan atención. Todo se deriva de las fechas,
// así que cuando llegue el backend solo hacen falta `fecha`, `limite`, `estado` y `asignadoA`.

const MS_DIA = 86_400_000;

function hoy() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function aDia(iso) {
  return new Date(`${iso}T00:00:00`);
}

export function diasDesde(iso) {
  return Math.round((hoy() - aDia(iso)) / MS_DIA);
}

export function diasHasta(iso) {
  return Math.round((aDia(iso) - hoy()) / MS_DIA);
}

export function fechaHoyIso() {
  const d = hoy();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function plural(n, uno, varios) {
  return `${n} ${n === 1 ? uno : varios}`;
}

export function hace(iso) {
  const d = diasDesde(iso);
  if (d <= 0) return "hoy";
  if (d === 1) return "ayer";
  return `hace ${d} días`;
}

// Plazo de cierre de cotizaciones. tono: "alta" | "media" | "neutra"
export function plazoDe(limite) {
  if (!limite) return null;
  const d = diasHasta(limite);
  if (d < 0) return { texto: `Venció ${hace(limite)}`, tono: "alta", dias: d };
  if (d === 0) return { texto: "Cierra hoy", tono: "alta", dias: d };
  if (d <= 3) return { texto: `Cierra en ${plural(d, "día", "días")}`, tono: "media", dias: d };
  return { texto: `Cierra en ${plural(d, "día", "días")}`, tono: "neutra", dias: d };
}

const DIAS_REVISION_LARGA = 14;

// Qué le pasa a una solicitud desde el punto de vista del personal del INE.
// `atencion` es true solo cuando hay algo que hacer pronto (para no marcar todo como urgente).
export function situacionPersonal(s) {
  if (s.estado === "nueva") {
    const dias = diasDesde(s.fecha);
    if (!s.asignadoA) {
      return { texto: dias >= 2 ? `Sin asignar · ${hace(s.fecha)}` : "Sin asignar", tono: dias >= 2 ? "alta" : "media", atencion: dias >= 2 };
    }
    return { texto: "Falta invitar proveedores", tono: "media", atencion: false };
  }
  if (s.estado === "cotizacion") {
    const p = plazoDe(s.limite);
    return p ? { texto: p.texto, tono: p.tono, atencion: p.tono !== "neutra" } : { texto: "Cotizando", tono: "neutra", atencion: false };
  }
  if (s.estado === "revision") {
    const esperando = s.invitados.filter((i) => i.accion === "confirmar").length;
    if (esperando) return { texto: `Esperando confirmación de ${plural(esperando, "proveedor", "proveedores")}`, tono: "neutra", atencion: false };
    const dias = diasDesde(s.fecha);
    if (dias >= DIAS_REVISION_LARGA) return { texto: `${dias} días en revisión`, tono: "media", atencion: true };
    return { texto: "Ofertas por revisar", tono: "neutra", atencion: false };
  }
  return { texto: "Precio fijado", tono: "ok", atencion: false };
}

const PESO = { alta: 0, media: 1 };
export function porUrgencia(a, b) {
  const sa = situacionPersonal(a);
  const sb = situacionPersonal(b);
  const pa = sa.atencion ? PESO[sa.tono] : 2;
  const pb = sb.atencion ? PESO[sb.tono] : 2;
  return pa - pb || a.fecha.localeCompare(b.fecha);
}

export { DIAS_REVISION_LARGA };
