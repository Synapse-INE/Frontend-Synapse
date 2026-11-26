import { ApiError, enviarArchivo, solicitar } from "../../servicios/api";

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
  const creada = await solicitar("/solicitudes", { method: "POST", cuerpo });
  try {
    for (const archivo of archivos) {
      await enviarArchivo(`/solicitudes/${creada.id}/adjuntos`, archivo);
    }
    return await solicitar(`/solicitudes/${creada.id}/enviar`, { method: "POST" });
  } catch (fallo) {
    const detail = fallo instanceof ApiError ? fallo.detail : "No se pudieron adjuntar los PDF.";
    throw new ApiError(
      fallo instanceof ApiError ? fallo.status : 0,
      fallo instanceof ApiError ? fallo.code : undefined,
      `${detail} El borrador ${creada.codigo} quedó guardado en tu cuenta.`,
      fallo instanceof ApiError ? fallo.errors : [],
    );
  }
}
