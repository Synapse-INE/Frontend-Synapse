export const PRECIOS = [
  {
    id: "lap-8",
    bien: "Computadora portátil",
    corto: "Laptop 8 GB",
    especificacion: '8 GB RAM, 256 GB SSD, 14"',
    unidad: "Unidad",
    precio: 4850,
    metodo: "Mediana",
    estado: "publicado",
    comparativo: 76,
  },
  {
    id: "lap-16",
    bien: "Computadora portátil",
    corto: "Laptop 16 GB",
    especificacion: '16 GB RAM, 512 GB SSD, 15.6"',
    unidad: "Unidad",
    precio: 6420,
    metodo: "Promedio",
    estado: "publicado",
    comparativo: 100,
  },
  {
    id: "imp",
    bien: "Impresora multifuncional",
    corto: "Impresora",
    especificacion: "Láser, dúplex, red Ethernet",
    unidad: "Unidad",
    precio: 1975,
    metodo: "Moda",
    estado: "publicado",
    comparativo: 31,
  },
  {
    id: "esc",
    bien: "Escritorio escolar",
    corto: "Escritorio",
    especificacion: "Madera y metal, para primaria",
    unidad: "Unidad",
    precio: 385,
    metodo: "Mediana",
    estado: "publicado",
    comparativo: 12,
  },
  {
    id: "kit",
    bien: "Kit de papelería institucional",
    corto: "Kit papelería",
    especificacion: "Resma carta, folders y tóner",
    unidad: "Kit",
    precio: 248.5,
    metodo: "Promedio",
    estado: "revision",
    comparativo: 8,
  },
];

export const COTIZACIONES_CASO = [
  { proveedor: "A", monto: 4200, altura: 62 },
  { proveedor: "B", monto: 4500, altura: 70 },
  { proveedor: "C", monto: 4800, altura: 78, referencia: true },
  { proveedor: "D", monto: 5100, altura: 86 },
  { proveedor: "E", monto: 5400, altura: 96 },
];

export const PRECIO_REFERENCIA_CASO = 4850;

export const FUENTES_ESTUDIO = [
  { clave: "mercado", etiqueta: "Mercado relevante", corto: "Mercado rel.", porcentaje: 55, clase: "sw-azul" },
  { clave: "guatecompras", etiqueta: "GUATECOMPRAS", corto: "GUATECOMPRAS", porcentaje: 25, clase: "sw-naranja" },
  { clave: "historicos", etiqueta: "Históricos INE", corto: "Históricos INE", porcentaje: 20, clase: "sw-lima" },
];

export const PUBLICACION_MENSUAL = [
  { mes: "Jul", x: 16, y: 108 },
  { mes: "Ago", x: 88, y: 86 },
  { mes: "Sep", x: 160, y: 64 },
  { mes: "Oct", x: 232, y: 52 },
  { mes: "Nov", x: 344, y: 28 },
];

export const MODALIDADES = [
  "Contrato abierto",
  "Subasta electrónica inversa",
  "Bienes y suministros importados",
];

export function formatearQuetzales(valor) {
  return `Q ${valor.toLocaleString("es-GT", {
    minimumFractionDigits: valor % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function filtrarPrecios(lista, consulta) {
  const q = consulta.trim().toLowerCase();
  if (!q) return lista;
  return lista.filter((item) =>
    `${item.bien} ${item.corto} ${item.especificacion} ${item.metodo}`.toLowerCase().includes(q)
  );
}
