import { ATRIBUTOS, atributosVacios } from "../../data/ofertasProveedor";

/** Límites alineados con `proveedores.dto.ts` y `ProductoProveedor` en Prisma. */
export const LIMITES_PRODUCTO = {
  nombre: 240,
  descripcion: 10_000,
  presentacion: 160,
  categoriaOriginal: 160,
  marca: 160,
  modelo: 160,
  especificacion: 500,
};

export const PRESENTACIONES_SUGERIDAS = [
  "Unidad",
  "Resma",
  "Ciento",
  "Caja",
  "Vial",
  "Frasco",
  "Galón",
  "Litro",
  "Kilogramo",
  "Paquete",
];

export const VACIO_PRODUCTO = {
  nombre: "",
  descripcion: "",
  presentacion: "",
  categoriaOriginal: "",
  monto: "",
  atributos: atributosVacios(),
};

export function atributosParaApi(actuales = {}) {
  const limpio = {};
  for (const campo of ATRIBUTOS) {
    const valor = String(actuales[campo.clave] ?? "").trim();
    if (!valor) continue;
    const max = LIMITES_PRODUCTO[campo.clave] ?? 500;
    limpio[campo.clave] = valor.slice(0, max);
  }
  return Object.keys(limpio).length ? limpio : undefined;
}

export function validarProductoProveedor(datos) {
  const fallos = {};
  const nombre = datos.nombre.trim();
  const descripcion = datos.descripcion.trim();
  const presentacion = datos.presentacion.trim();
  const categoria = datos.categoriaOriginal.trim();
  const montoTexto = String(datos.monto ?? "").trim();

  if (!nombre) {
    fallos.nombre = "Escribe el nombre del producto.";
  } else if (nombre.length > LIMITES_PRODUCTO.nombre) {
    fallos.nombre = `El nombre admite hasta ${LIMITES_PRODUCTO.nombre} caracteres.`;
  }

  if (!descripcion) {
    fallos.descripcion = "Agrega la descripción o características que distinguen este producto.";
  } else if (descripcion.length > LIMITES_PRODUCTO.descripcion) {
    fallos.descripcion = `La descripción admite hasta ${LIMITES_PRODUCTO.descripcion.toLocaleString("es-GT")} caracteres.`;
  }

  if (presentacion.length > LIMITES_PRODUCTO.presentacion) {
    fallos.presentacion = `La presentación admite hasta ${LIMITES_PRODUCTO.presentacion} caracteres.`;
  }

  if (!categoria) {
    fallos.categoriaOriginal = "Elige una categoría del catálogo publicado por el INE.";
  } else if (categoria.length > LIMITES_PRODUCTO.categoriaOriginal) {
    fallos.categoriaOriginal = `La categoría admite hasta ${LIMITES_PRODUCTO.categoriaOriginal} caracteres.`;
  }

  if (!montoTexto) {
    fallos.monto = "Indica el precio con IVA en quetzales.";
  } else if (!/^\d+(\.\d{1,3})?$/.test(montoTexto)) {
    fallos.monto = "Usa un número positivo con hasta 3 decimales.";
  } else {
    const monto = Number(montoTexto);
    if (!Number.isFinite(monto) || monto < 0.001) {
      fallos.monto = "El precio debe ser mayor a cero.";
    }
  }

  for (const campo of ATRIBUTOS) {
    const valor = String(datos.atributos?.[campo.clave] ?? "").trim();
    const max = LIMITES_PRODUCTO[campo.clave];
    if (max && valor.length > max) {
      fallos[`atributo.${campo.clave}`] = `Máximo ${max} caracteres.`;
    }
  }

  return fallos;
}

/** Cuerpo JSON para `POST` / `PATCH` del catálogo del proveedor. */
export function armarCuerpoProducto(datos) {
  const monto = Number(String(datos.monto).trim());
  const atributos = atributosParaApi(datos.atributos);
  return {
    nombre: datos.nombre.trim(),
    descripcion: datos.descripcion.trim(),
    ...(datos.presentacion.trim() ? { presentacion: datos.presentacion.trim() } : {}),
    categoriaOriginal: datos.categoriaOriginal.trim(),
    ...(atributos ? { atributos } : {}),
    monto,
  };
}

const MAPA_CAMPOS_API = {
  nombre: "nombre",
  descripcion: "descripcion",
  presentacion: "presentacion",
  categoriaOriginal: "categoriaOriginal",
  monto: "monto",
  "atributos.marca": "atributo.marca",
  "atributos.modelo": "atributo.modelo",
  "atributos.especificacion": "atributo.especificacion",
};

export function erroresDesdeApi(fallo) {
  if (!fallo?.errors?.length) return {};
  const mapa = {};
  for (const item of fallo.errors) {
    const clave = MAPA_CAMPOS_API[item.field] || item.field;
    if (clave && item.message) mapa[clave] = item.message;
  }
  return mapa;
}