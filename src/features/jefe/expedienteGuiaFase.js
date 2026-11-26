import { ESTADOS_TRABAJO, SIGUIENTE_ESTADO } from "./expedienteTrabajoUtil";

/** Qué implica cada etapa mientras el expediente está ahí (tareas visibles). */
export const GUIA_POR_ESTADO = {
  RECIBIDA: {
    titulo: "Recepción",
    objetivo: "Verifica que la solicitud llegó completa y asigna quién la trabajará. Mientras tanto, los proveedores tienen 2 días para actualizar sus precios.",
    alAvanzar: "El expediente pasa a revisión documental: se valida el S.00 y los productos solicitados.",
  },
  EN_REVISION: {
    titulo: "Revisión documental",
    objetivo: "Confirma datos de la entidad, productos y modalidad. La investigación empieza cuando todos los proveedores actualicen sus precios o al vencer su plazo de 2 días.",
    alAvanzar: "Inicia la investigación de mercado: registra boletas con fuentes y precios observados.",
  },
  EN_INVESTIGACION: {
    titulo: "Investigación",
    objetivo: "Consulta fuentes (catálogo INE, proveedores, mercado) y registra al menos una boleta por producto.",
    alAvanzar: "Cierra la recolección y abre el análisis para confirmar el precio de referencia de cada producto.",
  },
  EN_ANALISIS: {
    titulo: "Análisis",
    objetivo: "Compara precios, revisa atípicos y confirma el precio adoptado con su criterio por producto.",
    alAvanzar: "Genera y emite el informe técnico con la estadística del expediente.",
  },
  EN_INFORME: {
    titulo: "Informe",
    objetivo: "Prepara el borrador del documento, revisa el texto y emítelo oficialmente.",
    alAvanzar: "Registra cómo se entrega el resultado a la entidad solicitante (digital, física o CD).",
  },
  EN_ENTREGA: {
    titulo: "Entrega",
    objetivo: "Anota medio, destinatario, fecha y constancia de entrega (con PDF si aplica).",
    alAvanzar: "Cierra el expediente como completado cuando la constancia quede registrada.",
  },
  EN_ESPERA: {
    titulo: "En espera",
    objetivo: "El trámite está pausado internamente. Reanuda cuando puedas continuar.",
    alAvanzar: null,
  },
};

/** Espera de proveedores: bloquea salir de Recibida hasta que todos actualicen o venza el plazo. */
export function esperaProveedores(detalle, ahora = Date.now()) {
  const avisos = detalle?.avisosPrecio || [];
  if (avisos.length === 0) return null;
  const actualizados = avisos.filter((aviso) => aviso.actualizadoEn);
  const pendientes = avisos.filter((aviso) => !aviso.actualizadoEn);
  const vence = new Date(Math.max(...avisos.map((aviso) => new Date(aviso.venceEn).getTime())));
  const vencido = ahora >= vence.getTime();
  return {
    total: avisos.length,
    actualizados: actualizados.length,
    pendientes,
    vence,
    vencido,
    bloquea: pendientes.length > 0 && !vencido,
  };
}

function tiempoRestante(fecha, ahora = Date.now()) {
  const ms = fecha.getTime() - ahora;
  if (ms <= 0) return "plazo vencido";
  const horas = Math.ceil(ms / 3_600_000);
  if (horas < 24) return `${horas} h restantes`;
  const dias = Math.floor(horas / 24);
  const resto = horas % 24;
  return resto ? `${dias} d ${resto} h restantes` : `${dias} d restantes`;
}

export function metricasTramite(detalle) {
  const productos = detalle?.productos || [];
  const totalProductos = productos.length;
  const conBoleta = new Set();

  for (const consulta of detalle?.consultas || []) {
    for (const precio of consulta.precios || []) {
      if (precio.productoSolicitudId) conBoleta.add(precio.productoSolicitudId);
    }
  }

  const validadas = new Set(
    (detalle?.validaciones || [])
      .filter((item) => item.confirmada)
      .map((item) => item.productoSolicitudId),
  );

  const informeEmitido = (detalle?.informes || []).some((item) => item.estado === "EMITIDO");
  const borradorInforme = (detalle?.informes || []).some((item) => item.estado !== "EMITIDO");
  const entregas = (detalle?.entregas || []).length;

  return {
    totalProductos,
    conBoleta,
    validadas,
    informeEmitido,
    borradorInforme,
    entregas,
    totalConsultas: (detalle?.consultas || []).length,
  };
}

/** Lista de requisitos con estado listo/pendiente para la fase actual. */
export function requisitosDeFase(detalle) {
  const estado = detalle?.estado;
  const m = metricasTramite(detalle);
  const items = [];

  if (!detalle?.asignadaAId) {
    items.push({ id: "responsable", listo: false, texto: "Jefe: asignar responsable del expediente" });
  } else {
    items.push({ id: "responsable", listo: true, texto: `Responsable: ${detalle.asignadaA?.nombre || "asignado"}` });
  }

  if (estado === "RECIBIDA" || estado === "EN_REVISION") {
    const espera = esperaProveedores(detalle);
    if (espera) {
      const listo = espera.pendientes.length === 0 || espera.vencido;
      let texto = `Proveedores al día: ${espera.actualizados}/${espera.total}`;
      if (espera.pendientes.length === 0) texto += " · todos actualizaron";
      else if (espera.vencido) texto += " · plazo vencido, se puede continuar";
      else texto += ` · ${tiempoRestante(espera.vence)}`;
      items.push({ id: "proveedores", listo, texto });
    }
  }

  if (estado === "RECIBIDA" || estado === "EN_REVISION") {
    items.push({
      id: "productos",
      listo: m.totalProductos > 0,
      texto: m.totalProductos > 0
        ? `${m.totalProductos} producto(s) en la solicitud`
        : "La solicitud no tiene productos",
    });
  }

  if (estado === "EN_INVESTIGACION" || estado === "EN_ANALISIS") {
    (detalle?.productos || []).forEach((producto) => {
      const tieneBoleta = m.conBoleta.has(producto.id);
      items.push({
        id: `boleta-${producto.id}`,
        listo: tieneBoleta,
        texto: tieneBoleta
          ? `Boleta registrada: ${producto.nombre}`
          : `Falta boleta: ${producto.nombre} · regístrala abajo en «Boletas de investigación»`,
      });
    });
  }

  if (estado === "EN_ANALISIS" || estado === "EN_INFORME") {
    (detalle?.productos || []).forEach((producto) => {
      const ok = m.validadas.has(producto.id);
      items.push({
        id: `val-${producto.id}`,
        listo: ok,
        texto: ok ? `Precio confirmado: ${producto.nombre}` : `Confirmar precio: ${producto.nombre}`,
      });
    });
  }

  if (estado === "EN_INFORME" || estado === "EN_ENTREGA") {
    items.push({
      id: "informe",
      listo: m.informeEmitido,
      texto: m.informeEmitido
        ? "Informe emitido"
        : m.borradorInforme
          ? "Borrador de informe listo: falta emitir"
          : "Preparar y emitir el informe",
    });
  }

  if (estado === "EN_ENTREGA") {
    items.push({
      id: "entrega",
      listo: m.entregas > 0,
      texto: m.entregas > 0 ? `${m.entregas} entrega(s) registrada(s)` : "Registrar entrega con constancia",
    });
  }

  return items;
}

/** Mensaje que impide avanzar (coincide con reglas clave del backend). */
export function bloqueoAvance(detalle) {
  const siguiente = SIGUIENTE_ESTADO[detalle?.estado];
  if (!siguiente) return null;
  const m = metricasTramite(detalle);
  const productos = detalle?.productos || [];

  if (siguiente === "EN_INVESTIGACION") {
    const espera = esperaProveedores(detalle);
    if (espera?.bloquea) {
      const nombres = espera.pendientes.map((aviso) => aviso.proveedor?.nombreComercial).filter(Boolean);
      return `Esperando a ${espera.pendientes.length} proveedor(es) para actualizar precios`
        + `${nombres.length ? ` (${nombres.slice(0, 3).join(", ")}${nombres.length > 3 ? "…" : ""})` : ""}. `
        + `Se podrá avanzar cuando todos actualicen o en ${tiempoRestante(espera.vence).replace(" restantes", "")}.`;
    }
  }

  if (siguiente === "EN_INFORME" && productos.length > 0 && m.validadas.size < productos.length) {
    return "Confirma el precio de cada producto en la sección «Precio confirmado» antes de pasar a informe.";
  }
  if (siguiente === "EN_ENTREGA" && !m.informeEmitido) {
    return "Emite el documento del expediente antes de avanzar a entrega.";
  }
  if (siguiente === "COMPLETADA" && m.entregas < 1) {
    return "Registra al menos una entrega con constancia antes de completar el expediente.";
  }
  return null;
}

/** Advertencias que no bloquean pero conviene resolver. */
export function advertenciasAvance(detalle) {
  const siguiente = SIGUIENTE_ESTADO[detalle?.estado];
  const avisos = [];
  const m = metricasTramite(detalle);

  if (siguiente === "EN_ANALISIS" && detalle?.productos?.length) {
    const faltan = detalle.productos.filter((p) => !m.conBoleta.has(p.id));
    if (faltan.length) {
      avisos.push(`Aún faltan boletas para: ${faltan.map((p) => p.nombre).join(", ")}.`);
    }
  }

  if (siguiente === "EN_INVESTIGACION" && !detalle?.asignadaAId) {
    avisos.push("Sin responsable asignado la entidad no verá avance claro.");
  }

  return avisos;
}

export function guiaActual(detalle) {
  return GUIA_POR_ESTADO[detalle?.estado] || null;
}

export function etiquetaEstado(estado) {
  return ESTADOS_TRABAJO[estado] || estado;
}