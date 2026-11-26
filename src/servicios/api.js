const BASE = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

let csrf = null;

export class ApiError extends Error {
  constructor(status, code, detail, errors = []) {
    super(detail || "La solicitud no pudo completarse.");
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.detail = detail;
    this.errors = errors;
  }
}

export function guardarCsrf(token) {
  csrf = token || null;
}

export function limpiarCsrf() {
  csrf = null;
}

async function leer(respuesta) {
  if (respuesta.status === 204) return null;
  const texto = await respuesta.text();
  if (!texto) return null;
  try {
    return JSON.parse(texto);
  } catch {
    return { detail: texto };
  }
}

async function renovarCsrf() {
  const respuesta = await fetch(`${BASE}/api/v1/auth/csrf`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  const datos = await leer(respuesta);
  if (!respuesta.ok) {
    throw new ApiError(respuesta.status, datos?.code, datos?.detail, datos?.errors);
  }
  csrf = datos.csrfToken;
  return csrf;
}

export async function solicitar(ruta, opciones = {}) {
  const method = opciones.method || "GET";
  const headers = { Accept: "application/json" };
  const muta = method !== "GET" && method !== "HEAD";
  if (opciones.cuerpo !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (muta && opciones.sesion !== false) {
    headers["x-csrf-token"] = csrf || (await renovarCsrf());
  }

  const respuesta = await fetch(`${BASE}/api/v1${ruta}`, {
    method,
    credentials: "include",
    headers,
    body: opciones.cuerpo !== undefined ? JSON.stringify(opciones.cuerpo) : undefined,
  });
  const datos = await leer(respuesta);
  if (!respuesta.ok) {
    const csrfInvalido = respuesta.status === 403 && datos?.detail === "Token CSRF no válido.";
    if (csrfInvalido && !opciones.reintento) {
      csrf = null;
      await renovarCsrf();
      return solicitar(ruta, { ...opciones, reintento: true });
    }
    throw new ApiError(respuesta.status, datos?.code, datos?.detail, datos?.errors || []);
  }
  return datos;
}

export async function enviarArchivo(ruta, archivo, campos = {}, opciones = {}) {
  const headers = {
    Accept: "application/json",
    "x-csrf-token": csrf || (await renovarCsrf()),
  };
  const cuerpo = new FormData();
  cuerpo.append("archivo", archivo);
  Object.entries(campos).forEach(([clave, valor]) => {
    if (valor) cuerpo.append(clave, valor);
  });
  const respuesta = await fetch(`${BASE}/api/v1${ruta}`, {
    method: "POST",
    credentials: "include",
    headers,
    body: cuerpo,
  });
  const datos = await leer(respuesta);
  if (!respuesta.ok) {
    const csrfInvalido = respuesta.status === 403 && datos?.detail === "Token CSRF no válido.";
    if (csrfInvalido && !opciones.reintento) {
      csrf = null;
      await renovarCsrf();
      return enviarArchivo(ruta, archivo, campos, { reintento: true });
    }
    throw new ApiError(respuesta.status, datos?.code, datos?.detail, datos?.errors || []);
  }
  return datos;
}

export async function descargarArchivo(ruta, nombre) {
  const respuesta = await fetch(`${BASE}/api/v1${ruta}`, {
    credentials: "include",
    headers: { Accept: "application/pdf" },
  });
  if (!respuesta.ok) {
    const datos = await leer(respuesta);
    throw new ApiError(respuesta.status, datos?.code, datos?.detail, datos?.errors || []);
  }
  const blob = await respuesta.blob();
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre || "documento.pdf";
  enlace.click();
  URL.revokeObjectURL(url);
}
