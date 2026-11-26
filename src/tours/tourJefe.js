import { crearTour } from "./tourBase";

const CLAVE = "dpir.tour.jefe";

const PASOS = [
  {
    element: "#jefe-titulo",
    popover: {
      title: "Bandeja del jefe",
      description:
        "Aquí entran las solicitudes de precios. Tu papel es asignar cada expediente a un trabajador "
        + "y vigilar el plazo de <b>15 días</b> desde el envío.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#jefe-kpis",
    popover: {
      title: "Resumen por prioridad",
      description:
        "<ul>"
        + "<li><b>Sin asignar.</b> Aún no tienen responsable.</li>"
        + "<li><b>Por vencer.</b> Plazo cumplido o a dos días.</li>"
        + "<li><b>En trámite.</b> Ya tienen trabajador.</li>"
        + "<li><b>Cerradas.</b> Completadas, rechazadas o anuladas.</li>"
        + "</ul>"
        + "Pulsa una tarjeta para filtrar la lista.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#jefe-barra",
    popover: {
      title: "Lista y búsqueda",
      description:
        "<b>Por atender</b> muestra grupos por urgencia. <b>Todas</b> abre el catálogo completo "
        + "con filtro por estado. El buscador localiza código, título, entidad o trabajador.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#jefe-lista",
    popover: {
      title: "Expedientes y detalle",
      description:
        "Cada fila es una solicitud; el color lateral indica la prioridad. "
        + "Al pulsarla se abre un <b>panel desde la derecha</b> con avance, asignación, productos y archivos. "
        + "Ciérralo con <b>Cerrar</b>, Escape o un clic fuera del panel.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#jefe-plazo",
    popover: {
      title: "Actualizar y plazo",
      description:
        "Recuerda el límite de 15 días. <b>Actualizar</b> vuelve a leer la bandeja sin salir de esta pantalla.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: "#jefe-info-titulo",
    popover: {
      title: "Repetir el tutorial",
      description:
        "El botón <b>Tutorial</b>, junto al título de la bandeja, vuelve a abrir este recorrido cuando lo necesites.",
      side: "bottom",
      align: "center",
    },
    onHighlighted: () => {
      window.scrollTo({ left: 0, top: window.scrollY, behavior: "auto" });
    },
  },
];

const { runTour, useTourAuto } = crearTour({
  clave: CLAVE,
  pasos: PASOS,
  selectoresListo: ["#jefe-titulo", "#jefe-kpis", "#jefe-lista"],
});

export const runTourJefe = runTour;
export const useTourJefe = useTourAuto;