const FORMATO = new Intl.DateTimeFormat("es-GT", { day: "numeric", month: "short", year: "numeric" });

export function fechaCorta(iso) {
  return iso ? FORMATO.format(new Date(`${iso}T00:00:00`)) : "—";
}

const DIA_MES = new Intl.DateTimeFormat("es-GT", { day: "numeric", month: "short" });

export function fechaDia(iso) {
  return iso ? DIA_MES.format(new Date(`${iso}T00:00:00`)) : "";
}

export function iniciales(nombre) {
  return String(nombre ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// "Ana Morales" -> "Ana M."
export function nombreCorto(nombre) {
  const [primero, segundo] = String(nombre ?? "").split(/\s+/).filter(Boolean);
  return segundo ? `${primero} ${segundo[0]}.` : primero ?? "";
}
