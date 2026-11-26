const PARTICULAS = new Set(["a", "al", "de", "del", "e", "el", "en", "la", "las", "los", "o", "para", "por", "u", "un", "una", "y"]);

export function tituloCategoria(texto) {
  const palabras = String(texto ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("es")
    .split(" ");
  if (!palabras[0]) return "";
  return palabras
    .map((palabra, indice) => {
      const base = palabra.replace(/[^a-záéíóúüñ]/gi, "");
      if (indice > 0 && PARTICULAS.has(base)) return palabra;
      return palabra.replace(/[a-záéíóúüñ]/i, (letra) => letra.toLocaleUpperCase("es"));
    })
    .join(" ");
}

export function compararCategoria(texto) {
  return tituloCategoria(texto)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("es");
}
