export const USOS = [
  {
    n: "01",
    titulo: "Transparencia",
    texto: "Las instituciones justifican cuánto pagan y por qué, con respaldo técnico del INE.",
  },
  {
    n: "02",
    titulo: "Control del gasto",
    texto: "Se evitan sobreprecios y compras a valores inflados respecto al mercado.",
  },
  {
    n: "03",
    titulo: "Base legal",
    texto: "Requisito de la Ley de Contrataciones del Estado para varias modalidades de compra.",
  },
  {
    n: "04",
    titulo: "Decisión presupuestaria",
    texto: "Permiten planificar con datos reales, no con estimaciones a ciegas.",
  },
];

export const PASOS = [
  {
    titulo: "Recepción",
    texto: "La institución envía oficio a la máxima autoridad del INE, con el bien o servicio a adquirir.",
  },
  {
    titulo: "Revisión",
    texto: "Se verifica descripción, cantidades y especificaciones técnicas según el reglamento de la modalidad.",
  },
  {
    titulo: "Investigación",
    texto: "Se recogen cotizaciones: proveedores, catálogos en línea, GUATECOMPRAS e históricos del INE.",
  },
  {
    titulo: "Análisis",
    texto: "Se calcula promedio, mediana o moda para obtener un precio representativo y confiable.",
  },
  {
    titulo: "Informe",
    texto: "Se documentan fuentes, metodología y el precio de referencia resultante.",
  },
  {
    titulo: "Entrega",
    texto: "El informe se envía a la entidad solicitante y, cuando corresponde, se publica.",
  },
];

export const METODOS = [
  {
    titulo: "Promedio",
    texto: "Suma de precios entre el número de datos. Útil cuando las cotizaciones son parecidas y ninguna se sale del mercado.",
    tipo: "promedio",
    barras: [62, 70, 78, 86, 94],
    nota: "Ejemplo: Q 4,800",
  },
  {
    titulo: "Mediana",
    texto: "El valor del centro. No se deja arrastrar por un proveedor excesivamente caro o barato respecto al resto.",
    tipo: "mediana",
    barras: [55, 62, 78, 86, 40],
    centro: 2,
    nota: "Se usa con precios atípicos",
  },
  {
    titulo: "Moda",
    texto: "El precio que más se repite: el más frecuente del mercado cuando varias cotizaciones coinciden en el mismo valor.",
    tipo: "moda",
    frecuencias: [1, 2, 4, 2, 1],
    moda: 2,
    nota: "Q 4,800 se repite 4 veces",
  },
];

export const ENTIDADES = [
  {
    titulo: "Ministerios",
    texto: "Educación, Salud, Defensa y demás organismos del Estado.",
  },
  {
    titulo: "Municipalidades",
    texto: "Gobiernos locales de todo el país.",
  },
  {
    titulo: "Entidades autónomas",
    texto: "IGSS, universidades estatales y empresas de capital mayoritariamente público.",
  },
  {
    titulo: "ONG y sin fines de lucro",
    texto: "Cuando reciben o administran fondos públicos.",
  },
];

export const REQUISITOS_SOLICITUD = [
  "Descripción técnica del bien o servicio",
  "Cantidades y unidad de medida",
  "Modalidad de compra prevista",
  "Datos de la entidad requirente",
];
