import { crearTour } from "./tourBase";

const CLAVE = "dpir.tour.trabajador";

const PASOS = [
  {
    element: "#trab-titulo",
    popover: {
      title: "Bandeja del trabajador",
      description:
        "Aquí ves los expedientes del INE. Trabajas los que el jefe te asigna o en los que colaboras. "
        + "El plazo de atención es de <b>15 días</b> desde el envío.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#trab-kpis",
    popover: {
      title: "Tus prioridades",
      description:
        "<ul>"
        + "<li><b>A mi cargo.</b> Eres responsable.</li>"
        + "<li><b>Apoyo.</b> Colaboras con otro analista.</li>"
        + "<li><b>Por vencer.</b> Plazo crítico en tus expedientes.</li>"
        + "<li><b>Cerradas.</b> Ya finalizadas.</li>"
        + "</ul>",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#trab-lista",
    popover: {
      title: "Lista de expedientes",
      description: "Abre un caso en el panel derecho. En <b>Mis expedientes</b> solo ves los tuyos; en <b>Todas</b> puedes consultar el resto.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#trab-tutorial",
    popover: {
      title: "Tutorial",
      description: "Vuelve a abrir este recorrido cuando lo necesites.",
      side: "bottom",
      align: "center",
    },
  },
];

const { runTour, useTourAuto } = crearTour({
  clave: CLAVE,
  pasos: PASOS,
  selectoresListo: ["#trab-titulo", "#trab-kpis", "#trab-lista"],
});

export const runTourTrabajador = runTour;
export const useTourTrabajador = useTourAuto;