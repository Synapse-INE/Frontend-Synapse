// Datos de EJEMPLO para el portal mientras el backend no está unido.
// Todo es ficticio. Cuando exista la API, solo cambian las funciones de src/servicios/portal.js.

// Pasos que ve el proveedor en el seguimiento de cada solicitud.
export const PASOS_PROVEEDOR = [
  { id: "invitacion", titulo: "Invitación recibida", detalle: "El INE te pidió cotizar" },
  { id: "cotizacion", titulo: "Cotización enviada", detalle: "Tu oferta llegó al INE" },
  { id: "revision", titulo: "En revisión", detalle: "El INE analiza las ofertas" },
  { id: "precio", titulo: "Precio confirmado", detalle: "Tu precio quedó registrado" },
];

// Estados de la solicitud para el personal (nombres pendientes de confirmar con el backend).
export const ESTADOS = [
  { id: "nueva", etiqueta: "Nuevas" },
  { id: "cotizacion", etiqueta: "En cotización" },
  { id: "revision", etiqueta: "En revisión" },
  { id: "cerrada", etiqueta: "Cerradas" },
];
export const NOMBRE_ESTADO = { nueva: "Nueva", cotizacion: "En cotización", revision: "En revisión", cerrada: "Cerrada" };

// Proveedores de ejemplo (el personal del INE ve sus nombres; entre proveedores no se ven).
export const PROVEEDORES = {
  "prov-01": "Distribuidora Tecnológica Demo, S. A.",
  "prov-02": "Suministros Industriales del Norte",
  "prov-03": "Comercial Altiplano, S. A.",
  "prov-04": "Importadora Centroamericana Demo",
  "prov-05": "Seguridad y Equipos Chapín",
};

// Cuentas de prueba (solo para la demo del front).
export const CUENTAS = [
  {
    correo: "personal@ine.demo",
    clave: "demo1234",
    rol: "personal",
    nombre: "Ana Morales",
    cargo: "Analista de precios",
  },
  {
    correo: "proveedor@demo.gt",
    clave: "demo1234",
    rol: "proveedor",
    nombre: "Distribuidora Tecnológica Demo, S. A.",
    proveedorId: "prov-01",
  },
];

// invitados[].paso: 0 invitación, 1 cotización enviada, 2 en revisión, 3 precio confirmado.
// invitados[].accion: lo que el proveedor debe hacer ahora ("cotizar" o "confirmar"), o null.
export const SOLICITUDES = [
  {
    id: "s1", numero: "SOL-2026-0001", institucion: "Ministerio de Educación",
    titulo: "500 laptops para escuelas", modalidad: "Contrato abierto",
    fecha: "2026-11-23", estado: "nueva", asignadoA: null, limite: null, invitados: [],
  },
  {
    id: "s2", numero: "SOL-2026-0002", institucion: "Municipalidad de Mixco",
    titulo: "Papel bond tamaño carta, 2,000 resmas", modalidad: "Subasta electrónica inversa",
    fecha: "2026-11-23", estado: "nueva", asignadoA: null, limite: null, invitados: [],
  },
  {
    id: "s3", numero: "SOL-2026-0003", institucion: "Ministerio de Salud Pública",
    titulo: "Termómetros digitales infrarrojos, 800 unidades", modalidad: "Contrato abierto",
    fecha: "2026-11-20", estado: "cotizacion", asignadoA: "Ana Morales", limite: "2026-11-28",
    invitados: [
      { proveedorId: "prov-01", paso: 0, accion: "cotizar" },
      { proveedorId: "prov-02", paso: 1, accion: null },
      { proveedorId: "prov-03", paso: 1, accion: null },
    ],
  },
  {
    id: "s4", numero: "SOL-2026-0004", institucion: "Universidad Estatal de Occidente",
    titulo: "Microscopios ópticos binoculares, 30 unidades", modalidad: "Bienes y suministros importados",
    fecha: "2026-11-18", estado: "cotizacion", asignadoA: "Luis Cifuentes", limite: "2026-11-27",
    invitados: [
      { proveedorId: "prov-01", paso: 1, accion: null },
      { proveedorId: "prov-04", paso: 0, accion: "cotizar" },
    ],
  },
  {
    id: "s5", numero: "SOL-2026-0005", institucion: "Ministerio de Gobernación",
    titulo: "Chalecos de seguridad reflectivos, 1,200 unidades", modalidad: "Contrato abierto",
    fecha: "2026-11-12", estado: "revision", asignadoA: "Ana Morales", limite: null,
    invitados: [
      { proveedorId: "prov-01", paso: 2, accion: null },
      { proveedorId: "prov-02", paso: 2, accion: null },
      { proveedorId: "prov-05", paso: 2, accion: null },
    ],
  },
  {
    id: "s6", numero: "SOL-2026-0006", institucion: "Municipalidad de Quetzaltenango",
    titulo: "Mobiliario escolar: escritorios y sillas, 600 juegos", modalidad: "Subasta electrónica inversa",
    fecha: "2026-11-10", estado: "revision", asignadoA: "Luis Cifuentes", limite: null,
    invitados: [
      { proveedorId: "prov-03", paso: 2, accion: null },
      { proveedorId: "prov-04", paso: 2, accion: null },
    ],
  },
  {
    id: "s7", numero: "SOL-2026-0007", institucion: "Ministerio de Agricultura",
    titulo: "Fertilizante granulado 15-15-15, 400 quintales", modalidad: "Contrato abierto",
    fecha: "2026-11-05", estado: "revision", asignadoA: "Ana Morales", limite: null,
    invitados: [
      { proveedorId: "prov-01", paso: 2, accion: "confirmar", propuesta: { precio: 318.5, unidad: "quintal" } },
      { proveedorId: "prov-02", paso: 2, accion: null },
    ],
  },
  {
    id: "s8", numero: "SOL-2026-0008", institucion: "Instituto de Fomento Municipal",
    titulo: "Tóner para impresoras multifuncionales, 250 unidades", modalidad: "Contrato abierto",
    fecha: "2026-10-28", estado: "cerrada", asignadoA: "Luis Cifuentes", limite: null,
    invitados: [
      { proveedorId: "prov-01", paso: 3, accion: null },
      { proveedorId: "prov-03", paso: 3, accion: null },
    ],
  },
  {
    id: "s9", numero: "SOL-2026-0009", institucion: "Ministerio de Comunicaciones",
    titulo: "Conos y barreras de señalización vial, 900 piezas", modalidad: "Bienes y suministros importados",
    fecha: "2026-10-21", estado: "cerrada", asignadoA: "Ana Morales", limite: null,
    invitados: [
      { proveedorId: "prov-05", paso: 3, accion: null },
    ],
  },
  {
    id: "s10", numero: "SOL-2026-0010", institucion: "Hospital Regional de Cobán",
    titulo: "Guantes de nitrilo, 50,000 pares", modalidad: "Contrato abierto",
    fecha: "2026-11-22", estado: "nueva", asignadoA: null, limite: null, invitados: [],
  },
];
