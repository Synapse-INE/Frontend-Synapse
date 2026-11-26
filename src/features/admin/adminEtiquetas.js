export const ROL_API = {
  ADMIN: "Administrador",
  JEFE: "Jefe",
  TRABAJADOR_INE: "Trabajador",
  PROVEEDOR: "Proveedor",
  SOLICITANTE: "Solicitante",
};

export const ESTADO_CUENTA = {
  PENDIENTE_VERIFICACION: "Correo sin verificar",
  PENDIENTE_APROBACION: "Espera aprobación",
  ACTIVO: "Activa",
  BLOQUEADO: "Bloqueada",
  DESACTIVADO: "Desactivada",
};

export const FILTROS_ROL = [
  { valor: "", etiqueta: "Todos los accesos" },
  ...Object.entries(ROL_API).map(([valor, etiqueta]) => ({ valor, etiqueta })),
];

export const FILTROS_ESTADO = [
  { valor: "", etiqueta: "Todos los estados" },
  ...Object.entries(ESTADO_CUENTA).map(([valor, etiqueta]) => ({ valor, etiqueta })),
];

const ACCIONES = {
  INICIO_SESION: "Inicio de sesión",
  INICIO_SESION_FALLIDO: "Intento fallido",
  CIERRE_SESION: "Cierre de sesión",
  REGISTRO_SOLICITANTE: "Registro de solicitante",
  CORREO_VERIFICADO: "Correo verificado",
  SOLICITANTE_APROBADO: "Solicitante aprobado",
  SOLICITANTE_RECHAZADO: "Solicitante rechazado",
  INVITACION_CREADA: "Invitación a proveedor",
  MODALIDAD_ACTIVADA: "Modalidad activada",
  MODALIDAD_INACTIVA: "Modalidad inactiva",
};

const RECURSOS = {
  sesion_usuario: "Sesión",
  usuario: "Usuario",
  tipo_modalidad: "Modalidad",
  invitacion_proveedor: "Invitación",
  solicitud_precio: "Solicitud",
};

export function accionLegible(codigo) {
  if (!codigo) return "—";
  if (ACCIONES[codigo]) return ACCIONES[codigo];
  return codigo
    .toLowerCase()
    .split("_")
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(" ");
}

export function recursoLegible(codigo) {
  if (!codigo) return "—";
  return RECURSOS[codigo] || codigo.replaceAll("_", " ");
}

export function tonoAccion(codigo) {
  if (!codigo) return "neutro";
  if (codigo.includes("FALLIDO") || codigo.includes("RECHAZ")) return "aviso";
  if (codigo.includes("SESION") || codigo === "CIERRE_SESION") return "sesion";
  if (codigo.includes("APROB") || codigo.includes("VERIFIC") || codigo.includes("ACTIV")) return "ok";
  if (codigo.includes("INVIT") || codigo.includes("REGISTRO")) return "naranja";
  return "neutro";
}