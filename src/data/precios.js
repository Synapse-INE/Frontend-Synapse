export const PRECIOS = [
  {
    id: "anf-1",
    correlativo: 1,
    modalidad: "Bienes y suministros importados",
    nog: "NA",
    evento: "CBySI 08-2023-UNOP",
    producto: "Anfotericina B Complejo Lipídico Vial 50mg/10ml",
    caracteristicas:
      "Anfotericina B Complejo Lipídico Vial 50mg/10ml. Suspensión inyectable IV.",
    presentacion: "Vial",
    precio: 1347.99,
    fechaPublicacion: "2023-11-10",
    categoriaId: "",
    vigenciaHasta: "1969-12-31",
  },
  {
    id: "papel-1",
    correlativo: 2,
    modalidad: "Subasta electrónica inversa",
    nog: "5290163",
    evento: "Procedimiento regulado por el Art. 54Bis",
    producto: "Papel Bond tamaño carta 75 gr.",
    caracteristicas:
      "Papel Bond para impresión y fotocopiado, tamaño carta (8 ½\" x 11\"); de 75 gramos por metro cuadrado.",
    presentacion: "Resma",
    precio: 23.3,
    fechaPublicacion: "2016-09-02",
    categoriaId: "papeleria-y-articulos-de-libreria",
    vigenciaHasta: "2026-12-31",
  },
  {
    id: "lap-8",
    correlativo: 3,
    modalidad: "Contrato abierto",
    nog: "18765432",
    evento: "CA-INE-2026-014",
    producto: "Computadora portátil 8 GB",
    caracteristicas: '8 GB RAM, 256 GB SSD, 14"',
    presentacion: "Unidad",
    precio: 4850,
    fechaPublicacion: "2026-11-01",
    categoriaId: "equipo-de-computacion-electronicos",
    vigenciaHasta: "2027-11-01",
  },
  {
    id: "lap-16",
    correlativo: 4,
    modalidad: "Contrato abierto",
    nog: "18765433",
    evento: "CA-INE-2026-018",
    producto: "Computadora portátil 16 GB",
    caracteristicas: '16 GB RAM, 512 GB SSD, 15.6"',
    presentacion: "Unidad",
    precio: 6420,
    fechaPublicacion: "2026-10-01",
    categoriaId: "equipo-de-computacion-electronicos",
    vigenciaHasta: "2027-10-01",
  },
  {
    id: "imp",
    correlativo: 5,
    modalidad: "Subasta electrónica inversa",
    nog: "17654321",
    evento: "SEI-2026-092",
    producto: "Impresora multifuncional",
    caracteristicas: "Láser, dúplex, red Ethernet",
    presentacion: "Unidad",
    precio: 1975,
    fechaPublicacion: "2026-09-01",
    categoriaId: "maquinas-impresoras",
    vigenciaHasta: "2027-09-01",
  },
];

export const MODALIDADES = [
  "Contrato abierto",
  "Subasta electrónica inversa",
  "Bienes y suministros importados",
];

export function formatearQuetzales(valor) {
  return `Q ${Number(valor).toLocaleString("es-GT", {
    minimumFractionDigits: valor % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatearFecha(valor) {
  if (!fechaRegistrada(valor)) return "No registrada";
  const [anio, mes, dia] = String(valor).split("-");
  if (!dia) return String(valor);
  return `${dia}/${mes}/${anio}`;
}

export function textoOpcional(valor) {
  const texto = String(valor ?? "").trim();
  if (!texto || texto.toUpperCase() === "NA") return "No aplica";
  return texto;
}

export function fechaRegistrada(valor) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(valor ?? "")) && String(valor) > "1970-01-01";
}

export function estaVigente(valor, hoy = hoyIso()) {
  return fechaRegistrada(valor) && String(valor) >= hoy;
}

function hoyIso() {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}
