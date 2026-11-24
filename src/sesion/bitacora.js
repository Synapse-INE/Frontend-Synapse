const CLAVE = "dpir.bitacora";
const CLAVE_CATEGORIAS = "dpir.categorias-off";

export function leerBitacora() {
  try {
    const lista = JSON.parse(localStorage.getItem(CLAVE) || "[]");
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

export function anotar(autor, accion, detalle) {
  const lista = leerBitacora();
  lista.unshift({
    fecha: new Date().toISOString(),
    autor,
    accion,
    detalle,
  });
  localStorage.setItem(CLAVE, JSON.stringify(lista.slice(0, 200)));
}

export function categoriasApagadas() {
  try {
    const lista = JSON.parse(localStorage.getItem(CLAVE_CATEGORIAS) || "[]");
    return new Set(Array.isArray(lista) ? lista : []);
  } catch {
    return new Set();
  }
}

export function fijarCategoria(id, activa) {
  const apagadas = categoriasApagadas();
  if (activa) apagadas.delete(id);
  else apagadas.add(id);
  localStorage.setItem(CLAVE_CATEGORIAS, JSON.stringify([...apagadas]));
}
