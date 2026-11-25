const CLAVE = "dpir.bitacora";
const CLAVE_MODALIDADES = "dpir.modalidades-off";

function leerLista(clave) {
  try {
    const lista = JSON.parse(localStorage.getItem(clave) || "[]");
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function normalizar(item) {
  const metadatos = item.metadatos && typeof item.metadatos === "object"
    ? item.metadatos
    : item.detalle
      ? { detalle: item.detalle }
      : null;
  return {
    creadoEn: item.creadoEn || item.fecha || new Date().toISOString(),
    actor: item.actor || item.autor || "Portal",
    accion: item.accion || "Movimiento",
    recurso: item.recurso || "general",
    recursoId: item.recursoId || null,
    metadatos,
  };
}

export function leerBitacora() {
  return leerLista(CLAVE).map(normalizar);
}

export function anotar({ actor, accion, recurso, recursoId = null, metadatos = null }) {
  const lista = leerBitacora();
  lista.unshift({
    creadoEn: new Date().toISOString(),
    actor,
    accion,
    recurso,
    recursoId,
    metadatos,
  });
  localStorage.setItem(CLAVE, JSON.stringify(lista.slice(0, 200)));
}

export function detalleDe(item) {
  if (!item?.metadatos) return "—";
  return Object.values(item.metadatos).filter(Boolean).join(" · ") || "—";
}

export function modalidadesApagadas() {
  return new Set(leerLista(CLAVE_MODALIDADES));
}

export function fijarModalidad(id, activa) {
  const apagadas = modalidadesApagadas();
  if (activa) apagadas.delete(id);
  else apagadas.add(id);
  localStorage.setItem(CLAVE_MODALIDADES, JSON.stringify([...apagadas]));
}
