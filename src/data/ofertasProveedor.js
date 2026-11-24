export const PROVEEDOR = "Papelería del Centro";
export const IVA = 0.12;
export const MESES_VIGENTE = 6;

export const ESTADOS = [
  { id: "vigente", etiqueta: "Vigente" },
  { id: "por_confirmar", etiqueta: "Por confirmar" },
  { id: "no_reconfirmado", etiqueta: "No reconfirmado" },
];

const PAPEL = "papeleria-y-articulos-de-libreria";

const PLANTILLAS = {
  [PAPEL]: [
    { clave: "marca", etiqueta: "Marca" },
    { clave: "material", etiqueta: "Material" },
    { clave: "medida", etiqueta: "Medida" },
  ],
  "equipo-de-computacion-electronicos": [
    { clave: "marca", etiqueta: "Marca" },
    { clave: "modelo", etiqueta: "Modelo" },
    { clave: "memoria", etiqueta: "Memoria" },
    { clave: "almacenamiento", etiqueta: "Almacenamiento" },
  ],
  "maquinas-impresoras": [
    { clave: "marca", etiqueta: "Marca" },
    { clave: "modelo", etiqueta: "Modelo" },
    { clave: "tecnologia", etiqueta: "Tecnología" },
  ],
};

const PLANTILLA_BASE = [
  { clave: "marca", etiqueta: "Marca" },
  { clave: "modelo", etiqueta: "Modelo" },
  { clave: "especificacion", etiqueta: "Especificación" },
];

export function plantillaDe(categoriaId) {
  return PLANTILLAS[categoriaId] ?? PLANTILLA_BASE;
}

export function atributosVacios(categoriaId, actuales = {}) {
  const siguiente = {};
  for (const campo of plantillaDe(categoriaId)) {
    siguiente[campo.clave] = actuales[campo.clave] ?? "";
  }
  return siguiente;
}

function base(parcial) {
  return {
    categoriaId: PAPEL,
    presentacion: "Unidad",
    condiciones: "",
    sinRespuesta: false,
    atributos: {},
    ...parcial,
  };
}

function cambio(precioConIva, fecha, motivo) {
  return { precioConIva, fecha, motivo, autor: PROVEEDOR };
}

export const PRODUCTOS_INICIALES = [
  base({
    id: "pd-1",
    codigo: "PD-0001",
    producto: "Papel bond tamaño carta 75 gr.",
    descripcion: "75 g/m², carta, para impresión y fotocopia.",
    presentacion: "Resma",
    precioConIva: 24.5,
    condiciones: "Entrega en ciudad, 5 días hábiles.",
    atributos: { marca: "Copia", material: "Bond 75 g/m²", medida: "Carta" },
    fechaCarga: "2025-11-12",
    fechaActualizacion: "2026-09-10",
    historial: [
      cambio(22, "2025-11-12", "Carga inicial"),
      cambio(24.5, "2026-09-10", "Cambio de precio"),
    ],
  }),
  base({
    id: "pd-2",
    codigo: "PD-0002",
    producto: "Tóner negro para impresora láser",
    descripcion: "Rendimiento aproximado de 3 000 páginas.",
    precioConIva: 680,
    condiciones: "Garantía de 30 días sobre el empaque.",
    atributos: { marca: "Genérico", material: "Tóner", medida: "3 000 páginas" },
    fechaCarga: "2026-11-01",
    fechaActualizacion: "2026-11-01",
    historial: [cambio(680, "2026-11-01", "Carga inicial")],
  }),
  base({
    id: "pd-3",
    codigo: "PD-0003",
    producto: "Folder tamaño oficio",
    descripcion: "Cartulina, ceja reforzada.",
    presentacion: "Ciento",
    precioConIva: 95,
    condiciones: "Puesto en almacén.",
    atributos: { marca: "Oficio", material: "Cartulina", medida: "Oficio" },
    fechaCarga: "2026-04-01",
    fechaActualizacion: "2026-04-01",
    historial: [cambio(95, "2026-04-01", "Carga inicial")],
  }),
  base({
    id: "pd-4",
    codigo: "PD-0004",
    producto: "Marcador permanente punta fina",
    descripcion: "Caja de 12, tinta negra.",
    presentacion: "Caja",
    precioConIva: 42,
    atributos: { marca: "Permanente", material: "Tinta", medida: "Punta fina" },
    fechaCarga: "2026-08-20",
    fechaActualizacion: "2026-08-20",
    historial: [cambio(42, "2026-08-20", "Carga inicial")],
  }),
  base({
    id: "pd-5",
    codigo: "PD-0005",
    producto: "Grapadora de escritorio",
    descripcion: "Metal, capacidad de 20 hojas.",
    precioConIva: 38,
    atributos: { marca: "Escritorio", material: "Metal", medida: "20 hojas" },
    fechaCarga: "2025-09-01",
    fechaActualizacion: "2025-09-01",
    sinRespuesta: true,
    historial: [cambio(38, "2025-09-01", "Carga inicial")],
  }),
  base({
    id: "pd-6",
    codigo: "PD-0006",
    producto: "Clips metálicos n.º 1",
    descripcion: "Caja de 100 unidades.",
    presentacion: "Caja",
    precioConIva: 12.75,
    atributos: { marca: "Metálicos", material: "Acero", medida: "N.º 1" },
    fechaCarga: "2025-08-04",
    fechaActualizacion: "2026-03-15",
    historial: [
      cambio(11.5, "2025-08-04", "Carga inicial"),
      cambio(12.75, "2026-03-15", "Cambio de precio"),
    ],
  }),
];

export function etiquetaEstado(id) {
  return ESTADOS.find((item) => item.id === id)?.etiqueta ?? id;
}

export function precioSinIva(conIva) {
  return Math.round((Number(conIva) / (1 + IVA)) * 100) / 100;
}

export function estadoDe(item, hoy = new Date()) {
  if (item.sinRespuesta) return "no_reconfirmado";
  const fecha = new Date(`${item.fechaActualizacion}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) return "por_confirmar";
  const limite = new Date(fecha);
  limite.setMonth(limite.getMonth() + MESES_VIGENTE);
  const dia = new Date(hoy);
  dia.setHours(0, 0, 0, 0);
  return dia > limite ? "por_confirmar" : "vigente";
}
