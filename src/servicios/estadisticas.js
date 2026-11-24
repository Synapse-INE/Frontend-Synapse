import { estaVigente, formatearQuetzales } from "../data/precios";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const CLASES = ["sw-azul", "sw-naranja", "sw-lima"];
const CIRCUNFERENCIA = 2 * Math.PI * 72;

function medianaDe(valores) {
  if (!valores.length) return 0;
  const orden = [...valores].sort((a, b) => a - b);
  const medio = Math.floor(orden.length / 2);
  return orden.length % 2 ? orden[medio] : (orden[medio - 1] + orden[medio]) / 2;
}

export function estadisticasDe(items = []) {
  const lista = Array.isArray(items) ? items : [];
  const total = lista.length;
  const precios = lista.map((item) => Number(item.precio)).filter((n) => Number.isFinite(n) && n >= 0);
  const max = precios.length ? Math.max(...precios) : 0;
  const min = precios.length ? Math.min(...precios) : 0;
  const mediana = medianaDe(precios);

  const barras = [...lista]
    .filter((item) => Number.isFinite(Number(item.precio)))
    .sort((a, b) => a.precio - b.precio)
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      etiqueta: etiquetaCorta(item.producto),
      monto: item.precio,
      altura: max ? Math.max(8, (item.precio / max) * 96) : 0,
      referencia: false,
    }));

  if (barras.length) {
    let indice = 0;
    let distancia = Infinity;
    barras.forEach((barra, i) => {
      const d = Math.abs(barra.monto - mediana);
      if (d < distancia) {
        distancia = d;
        indice = i;
      }
    });
    barras[indice].referencia = true;
  }

  const conteoMetodo = new Map();
  for (const item of lista) {
    const clave = item.modalidad || "Sin modalidad";
    conteoMetodo.set(clave, (conteoMetodo.get(clave) || 0) + 1);
  }
  const metodos = [...conteoMetodo.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([etiqueta, n], i) => ({
      clave: `${i}-${etiqueta}`,
      etiqueta,
      corto: etiquetaCorta(etiqueta, 22),
      n,
      porcentaje: total ? Math.round((n / total) * 100) : 0,
      clase: CLASES[i],
    }));

  let offset = 0;
  const dona = metodos.map((metodo) => {
    const largo = (metodo.porcentaje / 100) * CIRCUNFERENCIA;
    const slice = { ...metodo, largo, offset, circunferencia: CIRCUNFERENCIA };
    offset += largo;
    return slice;
  });

  const conteoMes = new Map();
  for (const item of lista) {
    const clave = String(item.fechaPublicacion || "").slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(clave)) continue;
    conteoMes.set(clave, (conteoMes.get(clave) || 0) + 1);
  }
  const meses = [...conteoMes.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([clave, n]) => {
      const mes = Number(clave.slice(5, 7));
      return { clave, etiqueta: MESES[mes - 1] || clave, n };
    });

  const maxMes = Math.max(1, ...meses.map((m) => m.n));
  const puntos = meses.map((mes, i) => {
    const ultimo = Math.max(meses.length - 1, 1);
    return {
      mes: mes.etiqueta,
      n: mes.n,
      x: 28 + (i * 340) / ultimo,
      y: 168 - (mes.n / maxMes) * 132,
    };
  });

  const ultimo = meses.at(-1);
  const previo = meses.at(-2);
  let tendencia = "—";
  if (ultimo && previo) {
    if (ultimo.n > previo.n) tendencia = "↑ alza";
    else if (ultimo.n < previo.n) tendencia = "↓ baja";
    else tendencia = "= igual";
  } else if (ultimo) tendencia = `${ultimo.n}`;

  const comparativo = [...lista]
    .filter((item) => Number.isFinite(Number(item.precio)))
    .sort((a, b) => b.precio - a.precio)
    .slice(0, 5)
    .map((item) => ({
      ...item,
      comparativo: max ? Math.round((item.precio / max) * 100) : 0,
    }));

  const vigentes = lista.filter((item) => estaVigente(item.vigenciaHasta)).length;

  const indicadores = [
    {
      id: "renglones",
      etiqueta: "Renglones",
      valor: String(total),
      barra: total ? 100 : 0,
    },
    {
      id: "mediana",
      etiqueta: "Mediana",
      valor: total ? formatearQuetzales(mediana) : "—",
      barra: max ? Math.round((mediana / max) * 100) : 0,
    },
    {
      id: "minimo",
      etiqueta: "Precio más bajo",
      valor: total ? formatearQuetzales(min) : "—",
      barra: max ? Math.round((min / max) * 100) : 0,
    },
    {
      id: "maximo",
      etiqueta: "Precio más alto",
      valor: total ? formatearQuetzales(max) : "—",
      barra: total ? 100 : 0,
    },
    {
      id: "vigentes",
      etiqueta: "Vigentes",
      valor: total ? `${vigentes} de ${total}` : "—",
      barra: total ? Math.round((vigentes / total) * 100) : 0,
    },
  ];

  return {
    total,
    max,
    min,
    mediana,
    barras,
    metodos: dona,
    meses,
    puntos,
    mesActual: ultimo?.etiqueta ?? "—",
    tendencia,
    comparativo,
    principal: dona[0] ?? null,
    vigentes,
    indicadores,
  };
}

function etiquetaCorta(texto, max = 26) {
  const valor = String(texto ?? "").trim() || "Renglón";
  return valor.length > max ? `${valor.slice(0, max - 1)}…` : valor;
}
