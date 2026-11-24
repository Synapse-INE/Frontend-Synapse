import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const crudo = readFileSync(join(raiz, "scripts", "categorias-brutas.txt"), "utf8");

const IGNORAR = new Set([
  "",
  "-",
  "na",
  "n/a",
  "sin dato",
  "unidad",
  "docena",
  "paquete",
]);

function slug(texto) {
  return texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/sicotropicos/g, "psicotropicos")
    .replace(/antihemeticos/g, "antiemeticos")
    .replace(/oxitocitos/g, "oxitocicos")
    .replace(/microorganimos/g, "microorganismos")
    .replace(/anthipertensivos/g, "antihipertensivos")
    .replace(/&/g, " y ")
    .replace(/[;,./]+/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function limpiarNombre(texto) {
  let nombre = texto
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[-\s]+|[-\s.]+$/g, "")
    .replace(/([0-9])([A-ZÁÉÍÓÚÑ])/g, "$1 $2")
    .replace(/\s{2,}/g, " ")
    .trim();
  return nombre;
}

function puntuacion(nombre) {
  const acentos = (nombre.match(/[áéíóúüñÁÉÍÓÚÜÑ]/g) || []).length;
  return acentos * 4 + Math.min(nombre.length, 80) * 0.01;
}

const MINUSCULAS = new Set(["a", "al", "con", "de", "del", "e", "el", "en", "la", "las", "los", "o", "para", "por", "un", "una", "y"]);
const ACRONIMOS = new Set(["usp", "eca", "ara", "h2", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii", "nog", "ine"]);

function tituloLegible(texto) {
  const fragmentos = texto.toLocaleLowerCase("es").split(/(\s+|:\s*)/);
  let inicio = true;
  return fragmentos
    .map((frag) => {
      if (!frag) return frag;
      if (/^\s+$/.test(frag)) return frag;
      if (frag.startsWith(":")) {
        inicio = true;
        return frag;
      }
      const nucleo = frag.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
      const prefijo = frag.slice(0, frag.indexOf(nucleo) === -1 ? 0 : frag.indexOf(nucleo));
      const sufijo = nucleo ? frag.slice(prefijo.length + nucleo.length) : "";
      if (!nucleo) return frag;
      let palabra;
      if (ACRONIMOS.has(nucleo)) palabra = nucleo.toUpperCase();
      else if (!inicio && MINUSCULAS.has(nucleo)) palabra = nucleo;
      else palabra = nucleo.charAt(0).toLocaleUpperCase("es") + nucleo.slice(1);
      inicio = false;
      return `${prefijo}${palabra}${sufijo}`;
    })
    .join("");
}

const brutos = crudo.split(/\r?\n/).map((linea) => limpiarNombre(linea));

const porSlug = new Map();
for (const nombre of brutos) {
  const clave = slug(nombre);
  if (!clave || IGNORAR.has(nombre.toLowerCase()) || clave.length < 3) continue;
  const actual = porSlug.get(clave);
  if (!actual || puntuacion(nombre) > puntuacion(actual)) {
    porSlug.set(clave, nombre);
  }
}

const categorias = [...porSlug.entries()]
  .map(([id, nombre]) => ({ id, nombre: tituloLegible(nombre) }))
  .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }));

const archivo = `/** Catálogo de categorías de la publicación mensual (Select2 original, limpio).
 *  En producción vendrá del API de la DPIR. No editar a mano el HTML sucio.
 */
export const OPCIONES_BUSQUEDA = [
  { id: "todos", etiqueta: "Todos" },
  { id: "producto", etiqueta: "Producto" },
  { id: "categoria", etiqueta: "Categoría" },
  { id: "nog", etiqueta: "NOG" },
  { id: "fecha", etiqueta: "Fecha" },
];

export const CATEGORIAS = ${JSON.stringify(categorias, null, 2)};

export const CATEGORIA_POR_ID = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c]));

export const LIMITES_BUSQUEDA = {
  producto: 120,
  todos: 120,
  nog: 32,
  categoria: 96,
  fecha: 10,
};
`;

writeFileSync(join(raiz, "src", "data", "categorias.js"), archivo, "utf8");
console.log(`Categorías crudas: ${brutos.length}`);
console.log(`Categorías limpias: ${categorias.length}`);
