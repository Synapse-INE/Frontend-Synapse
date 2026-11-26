import { useEffect } from "react";
import { ejecutarTour, tourVisto } from "./tourBase";

const CLAVE = "dpir.tour.cuenta";

const PASOS_SOLICITANTE = [
  {
    element: "#cuenta-intro",
    popover: {
      title: "Tu espacio de usuario",
      description:
        "Aquí ves quién inició sesión, el rol de la cuenta y un resumen de qué puede hacer en el portal.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#cuenta-cta",
    popover: {
      title: "Nueva solicitud",
      description:
        "Con <b>Nueva solicitud</b> abres el formulario para pedir un precio de referencia al INE. "
        + "Solo está disponible cuando la cuenta de solicitante está aprobada.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: "#cuenta-resumen",
    popover: {
      title: "Filtros por estado",
      description:
        "<ul>"
        + "<li><b>Todas.</b> Historial completo.</li>"
        + "<li><b>En trámite.</b> Expedientes abiertos.</li>"
        + "<li><b>Pendientes.</b> Subsanación o borrador.</li>"
        + "<li><b>Cerradas.</b> Completadas, rechazadas o anuladas.</li>"
        + "</ul>",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#cuenta-herramientas",
    popover: {
      title: "Buscar y filtrar",
      description:
        "El buscador recorre código, asunto e institución. El desplegable de estado acota la lista. "
        + "Se combina con las tarjetas de arriba.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#cuenta-lista",
    popover: {
      title: "Tus solicitudes",
      description:
        "Cada fila es un expediente. Haz clic para abrir el detalle: pasos del trámite, comentarios, "
        + "adjuntos y acciones (editar, reenviar o anular según el estado).",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#cuenta-tutorial",
    popover: {
      title: "Repetir el tutorial",
      description: "Vuelve a este recorrido cuando quieras recordar cómo usar tu cuenta.",
      side: "bottom",
      align: "start",
    },
  },
];

const PASOS_PERSONAL = [
  {
    element: "#cuenta-intro",
    popover: {
      title: "Tu espacio de usuario",
      description: "Resumen de la sesión y del rol con el que trabajas en el portal.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#cuenta-cta",
    popover: {
      title: "Bandeja de trabajo",
      description:
        "<b>Abrir bandeja</b> lleva a la vista operativa donde se asignan y atienden las solicitudes del INE.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: "#cuenta-resumen",
    popover: {
      title: "Vista de solicitudes",
      description: "Las mismas tarjetas y filtros ayudan a localizar expedientes por estado o texto.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#cuenta-lista",
    popover: {
      title: "Detalle del expediente",
      description: "Al pulsar una fila abres el expediente en una ventana con seguimiento y documentos.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#cuenta-tutorial",
    popover: {
      title: "Repetir el tutorial",
      description: "Puedes consultar de nuevo estas indicaciones cuando lo necesites.",
      side: "bottom",
      align: "start",
    },
  },
];

function pasosParaRol(rol) {
  if (rol === "solicitante") return PASOS_SOLICITANTE;
  if (rol === "jefe" || rol === "trabajador" || rol === "admin") return PASOS_PERSONAL;
  return PASOS_SOLICITANTE;
}

function selectoresListo(rol) {
  if (rol === "solicitante") return ["#cuenta-intro", "#cuenta-resumen", "#cuenta-herramientas"];
  return ["#cuenta-intro", "#cuenta-resumen"];
}

export function runTourCuenta(rol = "solicitante", opciones) {
  ejecutarTour({ clave: CLAVE, pasos: pasosParaRol(rol), ...opciones });
}

export function useTourCuenta(rol) {
  useEffect(() => {
    if (!rol || tourVisto(CLAVE)) return undefined;
    let cancelado = false;
    const id = window.setTimeout(() => {
      if (cancelado || tourVisto(CLAVE)) return;
      const listo = selectoresListo(rol).every((sel) => document.querySelector(sel));
      if (!listo) return;
      runTourCuenta(rol, { recordar: true });
    }, 500);
    return () => {
      cancelado = true;
      window.clearTimeout(id);
    };
  }, [rol]);
}