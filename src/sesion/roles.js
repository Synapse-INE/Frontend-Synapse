export const ROLES = {
  admin: {
    id: "admin",
    etiqueta: "Administrador",
    resumen: "Administra usuarios, categorías y la bitácora.",
    destino: "/admin",
  },
  jefe: {
    id: "jefe",
    etiqueta: "Jefe",
    resumen: "Revisa solicitudes, análisis e informes del equipo.",
    destino: "/cuenta",
  },
  proveedor: {
    id: "proveedor",
    etiqueta: "Proveedor",
    resumen: "Mantiene su catálogo, sus precios y el historial.",
    destino: "/proveedor",
  },
  trabajador: {
    id: "trabajador",
    etiqueta: "Trabajador",
    resumen: "Envía solicitudes y consulta en qué van.",
    destino: "/cuenta",
  },
  externo: {
    id: "externo",
    etiqueta: "Cuenta",
    resumen: "La cuenta está registrada. El acceso se habilita desde la gestión del portal.",
    destino: "/cuenta",
  },
};

export const CLAVE_EJEMPLO = "Dpir-2026";

export const CUENTAS = [
  { nombre: "Elena Morales", correo: "elena.morales@ine.gob.gt", rol: "admin", clave: CLAVE_EJEMPLO },
  { nombre: "Carlos Méndez", correo: "carlos.mendez@ine.gob.gt", rol: "jefe", clave: CLAVE_EJEMPLO },
  { nombre: "Papelería del Centro", correo: "catalogo@papeleriadecentro.gt", rol: "proveedor", clave: CLAVE_EJEMPLO },
  { nombre: "Ana Ruiz", correo: "ana.ruiz@mineduc.gob.gt", rol: "trabajador", clave: CLAVE_EJEMPLO },
];

const CLAVE_EXTRA = "dpir.cuentas";

export function cuentasDisponibles() {
  try {
    const extra = JSON.parse(localStorage.getItem(CLAVE_EXTRA) || "[]");
    return [...CUENTAS, ...(Array.isArray(extra) ? extra : [])];
  } catch {
    return CUENTAS;
  }
}

export function guardarCuenta(cuenta) {
  const extra = cuentasDisponibles().filter((item) => !CUENTAS.some((base) => base.correo === item.correo));
  extra.push(cuenta);
  localStorage.setItem(CLAVE_EXTRA, JSON.stringify(extra));
}

const CLAVE_BLOQUEO = "dpir.bloqueos";

export function correosBloqueados() {
  try {
    const lista = JSON.parse(localStorage.getItem(CLAVE_BLOQUEO) || "[]");
    return Array.isArray(lista) ? lista.map((item) => String(item).toLowerCase()) : [];
  } catch {
    return [];
  }
}

export function estaBloqueada(correo) {
  return correosBloqueados().includes(String(correo || "").trim().toLowerCase());
}

export function fijarBloqueo(correo, bloqueada) {
  const actual = correosBloqueados().filter((item) => item !== correo.trim().toLowerCase());
  if (bloqueada) actual.push(correo.trim().toLowerCase());
  localStorage.setItem(CLAVE_BLOQUEO, JSON.stringify(actual));
}

export function actualizarCuenta(correo, cambios) {
  const extra = cuentasDisponibles().filter((item) => !CUENTAS.some((base) => base.correo === item.correo));
  const indice = extra.findIndex((item) => item.correo.toLowerCase() === correo.trim().toLowerCase());
  if (indice < 0) return false;
  extra[indice] = { ...extra[indice], ...cambios };
  localStorage.setItem(CLAVE_EXTRA, JSON.stringify(extra));
  return true;
}

export function buscarCuenta(correo, clave) {
  const cuenta = cuentasDisponibles().find(
    (item) => item.correo.toLowerCase() === correo.trim().toLowerCase() && item.clave === clave
  );
  if (!cuenta || estaBloqueada(cuenta.correo)) return undefined;
  return cuenta;
}

export function sesionValida(datos) {
  if (!datos || typeof datos !== "object") return null;
  const rol = ROLES[datos.rol];
  const nombre = String(datos.nombre || "").trim();
  const correo = String(datos.correo || "").trim();
  if (!rol || nombre.length < 2 || !correo.includes("@")) return null;
  return { nombre, correo, rol: rol.id };
}

export function inicialesDe(nombre) {
  return String(nombre)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}
