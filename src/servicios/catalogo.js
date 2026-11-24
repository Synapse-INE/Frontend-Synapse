import { CATEGORIA_POR_ID, LIMITES_BUSQUEDA, OPCIONES_BUSQUEDA } from "../data/categorias";
import { PRECIOS } from "../data/precios";

const OPCIONES_PERMITIDAS = new Set(OPCIONES_BUSQUEDA.map((o) => o.id));
const API_CATALOGO = String(import.meta.env.VITE_API_CATALOGO ?? "").replace(/\/$/, "");

function quitarControles(texto) {
  return String(texto ?? "").replace(/[\u0000-\u001F\u007F]/g, "");
}

function fechaValida(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}

export function sanitizarConsulta({ opcion, valor }) {
  const tipo = OPCIONES_PERMITIDAS.has(opcion) ? opcion : "todos";
  let limpio = quitarControles(valor).trim();
  const max = LIMITES_BUSQUEDA[tipo] ?? 120;
  if (limpio.length > max) limpio = limpio.slice(0, max);

  if (tipo === "nog") {
    limpio = limpio.replace(/[^0-9A-Za-z-]/g, "");
  }
  if (tipo === "fecha" && limpio && !fechaValida(limpio)) {
    limpio = "";
  }
  if (tipo === "categoria" && limpio && !CATEGORIA_POR_ID[limpio]) {
    limpio = "";
  }

  return { opcion: tipo, valor: limpio };
}

export function consultaDesdeUrl(params) {
  if (params.get("q") && !params.get("op") && !params.get("v")) {
    return sanitizarConsulta({ opcion: "producto", valor: params.get("q") });
  }
  return sanitizarConsulta({
    opcion: params.get("op") || "todos",
    valor: params.get("v") || "",
  });
}

export function consultaAParams({ opcion, valor }) {
  const limpia = sanitizarConsulta({ opcion, valor });
  const params = new URLSearchParams();
  if (limpia.opcion !== "todos" || limpia.valor) params.set("op", limpia.opcion);
  if (limpia.valor) params.set("v", limpia.valor);
  return params;
}

function coincideLocal(item, { opcion, valor }) {
  if (!valor) return true;
  const texto = [
    item.producto,
    item.caracteristicas,
    item.presentacion,
    item.evento,
    item.modalidad,
    item.nog,
  ]
    .join(" ")
    .toLowerCase();
  if (opcion === "producto") return texto.includes(valor.toLowerCase());
  if (opcion === "categoria") return item.categoriaId === valor;
  if (opcion === "nog") return String(item.nog ?? "").toLowerCase() === valor.toLowerCase();
  if (opcion === "fecha") return item.fechaPublicacion === valor;
  return texto.includes(valor.toLowerCase()) || item.categoriaId === valor || item.fechaPublicacion === valor;
}

export async function listarCategorias() {
  if (API_CATALOGO) {
    const respuesta = await fetch(`${API_CATALOGO}/categorias`, { credentials: "omit" });
    if (!respuesta.ok) throw new Error("No se pudieron cargar las categorías.");
    const datos = await respuesta.json();
    if (!Array.isArray(datos)) throw new Error("Respuesta de categorías no válida.");
    return datos;
  }
  return CATEGORIAS_DESDE_DATOS();
}

function CATEGORIAS_DESDE_DATOS() {
  return Object.values(CATEGORIA_POR_ID).sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
  );
}

export async function buscarPublicacion(consulta) {
  const limpia = sanitizarConsulta(consulta);
  if (API_CATALOGO) {
    const url = new URL(`${API_CATALOGO}/precios`);
    url.searchParams.set("op", limpia.opcion);
    if (limpia.valor) url.searchParams.set("v", limpia.valor);
    const respuesta = await fetch(url, { credentials: "omit" });
    if (!respuesta.ok) throw new Error("No se pudo consultar la publicación.");
    const datos = await respuesta.json();
    if (!Array.isArray(datos)) throw new Error("Respuesta de precios no válida.");
    return datos;
  }
  return PRECIOS.filter((item) => coincideLocal(item, limpia));
}
