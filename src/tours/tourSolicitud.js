import { crearTour } from "./tourBase";

const CLAVE = "dpir.tour.solicitud";

const PASOS = [
  {
    element: "#sol-intro",
    popover: {
      title: "Solicitud de precios",
      description:
        "Este formulario envía al INE la petición de precios de referencia. "
        + "Debe cumplir la forma del reglamento de la modalidad que elijas.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#sol-bloque-expediente",
    popover: {
      title: "1 · Datos del expediente",
      description:
        "<ul>"
        + "<li><b>Título y descripción.</b> Resumen claro de lo que se compra.</li>"
        + "<li><b>Modalidad y unidad ejecutora.</b> Tipo de contratación y dependencia que compra.</li>"
        + "<li><b>Enlace y autoridad.</b> Quién da seguimiento y quién firma el oficio.</li>"
        + "<li><b>Facilitación.</b> El botón puede completar nombre e institución desde tu cuenta.</li>"
        + "</ul>",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#sol-bloque-productos",
    popover: {
      title: "2 · Productos",
      description:
        "Agrega al menos un bien o servicio con especificaciones técnicas, unidad y cantidad. "
        + "Puedes duplicar una fila parecida o quitar productos sobrantes.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#sol-bloque-anexos",
    popover: {
      title: "3 · Anexos",
      description:
        "Los PDF son opcionales al crear la solicitud. Al <b>enviar</b>, los adjuntos quedan fijos "
        + "y la solicitud pasa a estado <b>Recibida</b> para la bandeja del INE.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#sol-enviar",
    popover: {
      title: "Enviar solicitud",
      description:
        "Revisa los campos obligatorios antes de enviar. Después podrás ver el código del expediente "
        + "en <b>Mi cuenta</b>.",
      side: "top",
      align: "center",
    },
  },
  {
    element: "#sol-info-titulo",
    popover: {
      title: "Repetir el tutorial",
      description:
        "El botón <b>Tutorial</b>, junto al título del formulario, vuelve a abrir este recorrido cuando lo necesites.",
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
  selectoresListo: ["#sol-intro", "#sol-bloque-expediente", "#sol-enviar"],
});

export const runTourSolicitud = runTour;
export const useTourSolicitud = useTourAuto;