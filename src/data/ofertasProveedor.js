export const PROVEEDOR_ID = "prov-papel";
export const PROVEEDOR = "Papelería del Centro";
export const MONEDA = "GTQ";
export const MESES_VIGENTE = 6;

export const ESTADOS = [
  { id: "vigente", etiqueta: "Vigente" },
  { id: "por_confirmar", etiqueta: "Por confirmar" },
];

export const ATRIBUTOS = [
  { clave: "marca", etiqueta: "Marca" },
  { clave: "modelo", etiqueta: "Modelo" },
  { clave: "especificacion", etiqueta: "Especificación" },
];

export function atributosVacios(actuales = {}) {
  const siguiente = {};
  for (const campo of ATRIBUTOS) siguiente[campo.clave] = actuales[campo.clave] ?? "";
  return siguiente;
}

export function sumarMeses(fechaIso, meses = MESES_VIGENTE) {
  const fecha = new Date(`${fechaIso}T00:00:00`);
  fecha.setMonth(fecha.getMonth() + meses);
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function precio(monto, fechaPrecio, registradoPorId = "u-papel") {
  return {
    monto,
    moneda: MONEDA,
    fechaPrecio,
    vigenciaHasta: sumarMeses(fechaPrecio),
    registradoPorId,
  };
}

function base(parcial) {
  return {
    proveedorId: PROVEEDOR_ID,
    presentacion: "Unidad",
    categoriaOriginal: "Papelería y artículos de librería",
    atributos: {},
    estado: "activo",
    ...parcial,
  };
}

export const PRODUCTOS_INICIALES = [
  base({
    id: "pd-1",
    codigoProveedor: "PD-0001",
    nombre: "Papel bond tamaño carta 75 gr.",
    descripcion: "75 g/m², carta, para impresión y fotocopia.",
    presentacion: "Resma",
    categoriaOriginal: "Papelería y artículos de librería",
    atributos: { marca: "Copia", modelo: "Bond", especificacion: "75 g/m², carta" },
    createdAt: "2025-11-12",
    precios: [precio(22, "2025-11-12"), precio(24.5, "2026-09-10")],
  }),
  base({
    id: "pd-2",
    codigoProveedor: "PD-0002",
    nombre: "Tóner negro para impresora láser",
    descripcion: "Rendimiento aproximado de 3 000 páginas.",
    categoriaOriginal: "Máquinas impresoras",
    atributos: { marca: "Genérico", modelo: "Láser", especificacion: "3 000 páginas" },
    createdAt: "2026-11-01",
    precios: [precio(680, "2026-11-01")],
  }),
  base({
    id: "pd-3",
    codigoProveedor: "PD-0003",
    nombre: "Folder tamaño oficio",
    descripcion: "Cartulina, ceja reforzada.",
    presentacion: "Ciento",
    categoriaOriginal: "Papelería y artículos de librería",
    atributos: { marca: "Oficio", modelo: "Ceja", especificacion: "Cartulina" },
    createdAt: "2026-04-01",
    precios: [precio(95, "2026-04-01")],
  }),
  base({
    id: "pd-4",
    codigoProveedor: "PD-0004",
    nombre: "Marcador permanente punta fina",
    descripcion: "Caja de 12, tinta negra.",
    presentacion: "Caja",
    categoriaOriginal: "Papelería y artículos de librería",
    atributos: { marca: "Permanente", modelo: "Punta fina", especificacion: "Tinta negra" },
    createdAt: "2026-08-20",
    precios: [precio(42, "2026-08-20")],
  }),
  base({
    id: "pd-5",
    codigoProveedor: "PD-0005",
    nombre: "Grapadora de escritorio",
    descripcion: "Metal, capacidad de 20 hojas.",
    categoriaOriginal: "Papelería y artículos de librería",
    atributos: { marca: "Escritorio", modelo: "Metal", especificacion: "20 hojas" },
    createdAt: "2025-09-01",
    precios: [precio(38, "2025-09-01")],
  }),
  base({
    id: "pd-6",
    codigoProveedor: "PD-0006",
    nombre: "Clips metálicos n.º 1",
    descripcion: "Caja de 100 unidades.",
    presentacion: "Caja",
    categoriaOriginal: "Papelería y artículos de librería",
    atributos: { marca: "Metálicos", modelo: "N.º 1", especificacion: "Acero" },
    createdAt: "2025-08-04",
    precios: [precio(11.5, "2025-08-04"), precio(12.75, "2026-03-15")],
  }),
];

export function etiquetaEstado(id) {
  return ESTADOS.find((item) => item.id === id)?.etiqueta ?? id;
}

export function precioActual(item) {
  const lista = item.precios || [];
  return lista[lista.length - 1] || null;
}

export function estadoDe(item, hoy = new Date()) {
  const precioVigente = precioActual(item);
  if (!precioVigente?.vigenciaHasta) return "por_confirmar";
  const fin = new Date(`${precioVigente.vigenciaHasta}T00:00:00`);
  const dia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return fin >= dia ? "vigente" : "por_confirmar";
}
