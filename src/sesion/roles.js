export const ROLES = {
  admin: {
    id: "admin",
    etiqueta: "Administrador",
    resumen: "Administra usuarios, modalidades y la bitácora.",
    destino: "/admin",
  },
  jefe: {
    id: "jefe",
    etiqueta: "Jefe",
    resumen: "Asigna las solicitudes a los trabajadores del INE.",
    destino: "/personal",
  },
  trabajador: {
    id: "trabajador",
    etiqueta: "Trabajador",
    resumen: "Atiende las solicitudes que el jefe le asigna.",
    destino: "/personal",
  },
  proveedor: {
    id: "proveedor",
    etiqueta: "Proveedor",
    resumen: "Mantiene su catálogo, sus precios y el historial.",
    destino: "/proveedor",
  },
  solicitante: {
    id: "solicitante",
    etiqueta: "Solicitante",
    resumen: "Envía solicitudes de su institución y consulta en qué van.",
    destino: "/cuenta",
  },
};

const PRIORIDAD = ["admin", "jefe", "trabajador", "proveedor", "solicitante"];

export const CLAVE_EJEMPLO = "Dpir-2026";

export const CUENTAS = [
  {
    id: "u-elena",
    nombre: "Elena Morales",
    correo: "elena.morales@ine.gob.gt",
    roles: ["admin"],
    clave: CLAVE_EJEMPLO,
    estado: "activo",
  },
  {
    id: "u-carlos",
    nombre: "Carlos Méndez",
    correo: "carlos.mendez@ine.gob.gt",
    roles: ["trabajador"],
    clave: CLAVE_EJEMPLO,
    estado: "activo",
  },
  {
    id: "u-papel",
    nombre: "Papelería del Centro",
    correo: "catalogo@papeleriadecentro.gt",
    roles: ["proveedor"],
    proveedorId: "prov-papel",
    clave: CLAVE_EJEMPLO,
    estado: "activo",
  },
  {
    id: "u-ana",
    nombre: "Ana Ruiz",
    correo: "ana.ruiz@mineduc.gob.gt",
    roles: ["solicitante"],
    clave: CLAVE_EJEMPLO,
    estado: "activo",
    perfil: {
      institucion: "Ministerio de Educación",
      cargo: "Analista de compras",
      estadoRevision: "aprobado",
    },
  },
];

const CLAVE_EXTRA = "dpir.cuentas";
const CLAVE_AJUSTES = "dpir.cuentas-ajustes";
const CLAVE_BLOQUEO = "dpir.bloqueos";

function leerJson(clave, vacio) {
  try {
    const valor = JSON.parse(localStorage.getItem(clave) || "");
    return valor ?? vacio;
  } catch {
    return vacio;
  }
}

function ajustes() {
  const mapa = leerJson(CLAVE_AJUSTES, {});
  return mapa && typeof mapa === "object" && !Array.isArray(mapa) ? mapa : {};
}

export function normalizarCuenta(cuenta) {
  const roles = (Array.isArray(cuenta.roles) ? cuenta.roles : [cuenta.rol]).filter((id) => ROLES[id]);
  const rol = PRIORIDAD.find((id) => roles.includes(id)) || roles[0];
  return {
    id: cuenta.id || cuenta.correo,
    nombre: cuenta.nombre,
    correo: cuenta.correo,
    clave: cuenta.clave,
    roles,
    rol,
    estado: cuenta.estado === "suspendido" ? "suspendido" : "activo",
    proveedorId: cuenta.proveedorId || null,
    perfil: cuenta.perfil || null,
  };
}

export function cuentasDisponibles() {
  const extra = leerJson(CLAVE_EXTRA, []);
  const mapa = ajustes();
  const todas = [...CUENTAS, ...(Array.isArray(extra) ? extra : [])];
  return todas.map((cuenta) => normalizarCuenta({ ...cuenta, ...(mapa[String(cuenta.correo).toLowerCase()] || {}) }));
}

export function guardarCuenta(cuenta) {
  const extra = leerJson(CLAVE_EXTRA, []);
  const lista = Array.isArray(extra) ? extra : [];
  lista.push(normalizarCuenta(cuenta));
  localStorage.setItem(CLAVE_EXTRA, JSON.stringify(lista));
}

export function actualizarCuenta(correo, cambios) {
  const clave = correo.trim().toLowerCase();
  const extra = leerJson(CLAVE_EXTRA, []);
  const lista = Array.isArray(extra) ? extra : [];
  const indice = lista.findIndex((item) => String(item.correo).toLowerCase() === clave);
  if (indice >= 0) {
    lista[indice] = normalizarCuenta({ ...lista[indice], ...cambios, correo: lista[indice].correo });
    localStorage.setItem(CLAVE_EXTRA, JSON.stringify(lista));
    return true;
  }
  if (!CUENTAS.some((item) => item.correo.toLowerCase() === clave)) return false;
  const mapa = ajustes();
  mapa[clave] = { ...mapa[clave], ...cambios };
  localStorage.setItem(CLAVE_AJUSTES, JSON.stringify(mapa));
  return true;
}

function correosBloqueados() {
  const lista = leerJson(CLAVE_BLOQUEO, []);
  return Array.isArray(lista) ? lista.map((item) => String(item).toLowerCase()) : [];
}

export function estaBloqueada(correo) {
  const clave = String(correo || "").trim().toLowerCase();
  const mapa = ajustes();
  if (mapa[clave]?.estado === "suspendido") return true;
  const extra = leerJson(CLAVE_EXTRA, []);
  const guardada = (Array.isArray(extra) ? extra : []).find((item) => String(item.correo).toLowerCase() === clave);
  if (guardada?.estado === "suspendido") return true;
  if (mapa[clave]?.estado === "activo") return false;
  return correosBloqueados().includes(clave);
}

export function fijarBloqueo(correo, bloqueada) {
  actualizarCuenta(correo, { estado: bloqueada ? "suspendido" : "activo" });
}

export function buscarCuenta(correo, clave) {
  const cuenta = cuentasDisponibles().find(
    (item) => item.correo.toLowerCase() === correo.trim().toLowerCase() && item.clave === clave
  );
  if (!cuenta || cuenta.estado === "suspendido" || estaBloqueada(cuenta.correo)) return undefined;
  return cuenta;
}

export function sesionValida(datos) {
  if (!datos || typeof datos !== "object") return null;
  const nombre = String(datos.nombre || "").trim();
  const correo = String(datos.correo || "").trim();
  const base = normalizarCuenta(datos);
  if (!base.rol || nombre.length < 2 || !correo.includes("@")) return null;
  if (estaBloqueada(correo)) return null;
  return {
    id: base.id,
    nombre,
    correo,
    rol: base.rol,
    roles: base.roles,
    proveedorId: base.proveedorId,
    estadoRevision: base.perfil?.estadoRevision || datos.estadoRevision || null,
    institucion: base.perfil?.institucion || datos.institucion || "",
    cargo: base.perfil?.cargo || datos.cargo || "",
  };
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
