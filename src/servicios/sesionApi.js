import { guardarCsrf, limpiarCsrf, solicitar } from "./api";

const PRIORIDAD = ["ADMIN", "JEFE", "TRABAJADOR_INE", "PROVEEDOR", "SOLICITANTE"];
const LOCAL = {
  ADMIN: "admin",
  JEFE: "jefe",
  TRABAJADOR_INE: "trabajador",
  PROVEEDOR: "proveedor",
  SOLICITANTE: "solicitante",
};

export function sesionDesdeUsuario(usuario) {
  const rolesApi = usuario?.roles || [];
  const principal = PRIORIDAD.find((rol) => rolesApi.includes(rol)) || rolesApi[0];
  const rol = LOCAL[principal] || "solicitante";
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.email,
    proveedorId: usuario.proveedorId ?? null,
    rol,
    roles: rolesApi.map((item) => LOCAL[item]).filter(Boolean),
    rolesApi,
    estadoRevision: "aprobado",
    institucion: "",
    cargo: "",
  };
}

export async function iniciarSesion(correo, clave) {
  const datos = await solicitar("/auth/iniciar-sesion", {
    method: "POST",
    sesion: false,
    cuerpo: { email: correo.trim(), password: clave },
  });
  guardarCsrf(datos.csrfToken);
  return sesionDesdeUsuario(datos.usuario);
}

export async function restaurarSesion() {
  try {
    const datos = await solicitar("/auth/yo");
    const token = await solicitar("/auth/csrf");
    guardarCsrf(token.csrfToken);
    return sesionDesdeUsuario(datos.usuario);
  } catch (error) {
    limpiarCsrf();
    if (error?.status === 401) return null;
    throw error;
  }
}

export async function cerrarSesion() {
  try {
    await solicitar("/auth/cerrar-sesion", { method: "POST" });
  } finally {
    limpiarCsrf();
  }
}

export async function registrarSolicitante(datos) {
  return solicitar("/auth/registro-solicitante", {
    method: "POST",
    sesion: false,
    cuerpo: {
      email: datos.correo.trim(),
      password: datos.clave,
      nombre: datos.nombre.trim(),
      ...(datos.cargo.trim() ? { cargo: datos.cargo.trim() } : {}),
      institucion: {
        nombreOficial: datos.institucion.trim(),
        ...(datos.nit.trim() ? { nit: datos.nit.trim() } : {}),
      },
    },
  });
}

export async function verificarCorreo(token) {
  await solicitar("/auth/verificar-correo", {
    method: "POST",
    sesion: false,
    cuerpo: { token },
  });
}

export async function aceptarInvitacion({ token, nombre, clave }) {
  const datos = await solicitar("/auth/aceptar-invitacion", {
    method: "POST",
    sesion: false,
    cuerpo: { token, nombre, password: clave },
  });
  return datos.usuario;
}
