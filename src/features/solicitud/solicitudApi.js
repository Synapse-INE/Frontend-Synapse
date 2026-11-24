// Reglas y llamada a la API del formulario de solicitud.
// Nombres de campos pendientes de confirmar contra docs/openapi.yaml (Carlos y Joshua).

export const TIPOS_PERMITIDOS = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
];
export const TEXTO_TIPOS = "PDF, DOCX, XLSX, PNG o JPG";
export const MAX_BYTES = 10 * 1024 * 1024; // 10 MB, igual que el backend
export const MAX_ARCHIVOS = 3;
export const MAX_DESCRIPCION = 2000;

// Primera barrera en el navegador: el backend verifica el contenido real del archivo.
export function validarArchivo(archivo) {
  if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
    return `"${archivo.name}": tipo no permitido. Usa ${TEXTO_TIPOS}.`;
  }
  if (archivo.size > MAX_BYTES) {
    return `"${archivo.name}": supera el máximo de 10 MB.`;
  }
  return null;
}

export class ApiError extends Error {
  constructor(status, code, errors = [], retryAfter) {
    super(code);
    this.status = status;
    this.code = code;
    this.errors = errors;
    this.retryAfter = retryAfter;
  }
}

const BASE = import.meta.env.VITE_API_URL ?? "";

// POST /api/v1/solicitudes (multipart).
// El campo "bien" del formulario viaja como "titulo", que es como lo llama el backend.
export async function enviarSolicitud({ institucion, bien, modalidad, descripcion, adjuntos, turnstileToken }) {
  const cuerpo = new FormData();
  cuerpo.append("titulo", bien.trim());
  cuerpo.append("institucion", institucion.trim());
  cuerpo.append("modalidad", modalidad);
  cuerpo.append("descripcion", descripcion.trim());
  cuerpo.append("turnstileToken", turnstileToken);
  adjuntos.forEach((a) => cuerpo.append("adjuntos", a));

  const respuesta = await fetch(`${BASE}/api/v1/solicitudes`, {
    method: "POST",
    body: cuerpo,
    credentials: "include",
  });

  if (!respuesta.ok) {
    const problema = await respuesta.json().catch(() => ({}));
    throw new ApiError(
      respuesta.status,
      problema.code ?? "ERROR_DESCONOCIDO",
      problema.errors ?? [],
      Number(respuesta.headers.get("Retry-After")) || undefined
    );
  }
  return respuesta.json(); // { numeroSeguimiento }
}

// Textos para el usuario según el code estable del backend.
export function mensajeDeError(error) {
  switch (error.code) {
    case "LIMITE_EXCEDIDO":
      return error.retryAfter
        ? `Hiciste demasiados envíos. Intenta de nuevo en ${error.retryAfter} segundos.`
        : "Hiciste demasiados envíos. Intenta de nuevo en unos minutos.";
    case "ARCHIVO_NO_PERMITIDO":
      return "Uno de los archivos no es de un tipo permitido.";
    case "VALIDACION_FALLIDA":
      return "Revisa los campos marcados.";
    default:
      return "No pudimos enviar tu solicitud. Intenta de nuevo.";
  }
}
