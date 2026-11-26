import { ApiError, enviarArchivo, solicitar } from "../../servicios/api";

async function conDiagnostico(etapa, operacion) {
  try {
    return await operacion();
  } catch (fallo) {
    const detalle = fallo instanceof ApiError
      ? { status: fallo.status, code: fallo.code, detail: fallo.detail }
      : { name: fallo?.name, message: fallo?.message };
    console.error(`[solicitud] Falló ${etapa}`, detalle);
    if (fallo instanceof ApiError) throw fallo;
    throw new Error(
      `No se pudo completar ${etapa}${fallo?.message ? `: ${fallo.message}` : "."}`,
    );
  }
}

export async function crearYEnviarSolicitud(datos, archivos = []) {
  const cuerpo = {
    titulo: datos.titulo.trim(),
    descripcion: datos.descripcion.trim(),
    modalidad: datos.modalidad,
    unidadEjecutora: datos.unidadEjecutora.trim(),
    fechaFormulario: datos.fechaFormulario,
    enlaceNombre: datos.enlaceNombre.trim(),
    enlaceCargo: datos.enlaceCargo.trim(),
    autoridadNombre: datos.autoridadNombre.trim(),
    autoridadCargo: datos.autoridadCargo.trim(),
    productos: datos.productos.map((item) => ({
      nombre: item.nombre.trim(),
      especificacionesTecnicas: item.especificacionesTecnicas.trim(),
      unidadMedida: item.unidadMedida.trim(),
      cantidad: item.cantidad.trim(),
    })),
  };
  const creada = await conDiagnostico("POST /api/v1/solicitudes", () => (
    solicitar("/solicitudes", { method: "POST", cuerpo })
  ));
  try {
    for (const archivo of archivos) {
      await conDiagnostico(`POST /api/v1/solicitudes/${creada.id}/adjuntos`, () => (
        enviarArchivo(`/solicitudes/${creada.id}/adjuntos`, archivo)
      ));
    }
    return await conDiagnostico(`POST /api/v1/solicitudes/${creada.id}/enviar`, () => (
      solicitar(`/solicitudes/${creada.id}/enviar`, { method: "POST" })
    ));
  } catch (fallo) {
    const detail = fallo instanceof ApiError
      ? fallo.detail || fallo.message
      : fallo.message || "Error de conexión desconocido.";
    throw new ApiError(
      fallo instanceof ApiError ? fallo.status : 0,
      fallo instanceof ApiError ? fallo.code : undefined,
      `${detail} El borrador ${creada.codigo} quedó guardado en tu cuenta.`,
      fallo instanceof ApiError ? fallo.errors : [],
    );
  }
}
