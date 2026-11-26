import { LIMITES_BUSQUEDA, OPCIONES_BUSQUEDA } from "../data/categorias";

const OPCIONES_PERMITIDAS = new Set(OPCIONES_BUSQUEDA.map((o) => o.id));
const BASE = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

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

export async function listarCategoriasPublicas() {
  const respuesta = await fetch(`${BASE}/api/v1/publicacion/categorias`, {
    headers: { Accept: "application/json" },
  });
  if (!respuesta.ok) throw new Error("No se pudieron cargar las categorías.");
  const datos = await respuesta.json();
  return Array.isArray(datos.categorias) ? datos.categorias : [];
}

export async function buscarPublicacion(consulta, { limite = 20, pagina = 1 } = {}) {
  const limpia = sanitizarConsulta(consulta);
  const url = new URL(`${BASE}/api/v1/publicacion/renglones`);
  url.searchParams.set("limite", String(limite));
  url.searchParams.set("pagina", String(pagina));
  const campo = {
    producto: "producto",
    categoria: "categoria",
    nog: "nog",
    fecha: "fecha",
    todos: "texto",
  }[limpia.opcion];
  if (limpia.valor && campo) url.searchParams.set(campo, limpia.valor);

  const respuesta = await fetch(url, { headers: { Accept: "application/json" } });
  if (!respuesta.ok) throw new Error("No se pudo consultar la publicación.");
  const datos = await respuesta.json();
  return {
    items: Array.isArray(datos.renglones) ? datos.renglones : [],
    total: Number(datos.total) || 0,
    vigentes: Number(datos.vigentes) || 0,
    pagina: Number(datos.pagina) || 1,
    paginas: Number(datos.paginas) || 1,
  };
}
