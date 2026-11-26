import { crearTour } from "./tourBase";

const CLAVE = "dpir.tour.admin";

const PASOS = [
  {
    element: "#admin-intro",
    popover: {
      title: "Consola de administración",
      description:
        "Desde aquí gestionas cuentas del portal, el catálogo y la auditoría. "
        + "Los números del resumen vienen de la base de datos en tiempo real.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#admin-nav",
    popover: {
      title: "Menú lateral",
      description:
        "<ul>"
        + "<li><b>Resumen.</b> Indicadores y accesos rápidos.</li>"
        + "<li><b>En revisión.</b> Solicitantes con correo verificado que esperan aprobación.</li>"
        + "<li><b>Usuarios.</b> Cuentas registradas y su estado.</li>"
        + "<li><b>Invitaciones.</b> Alta de proveedores por correo.</li>"
        + "<li><b>Modalidades.</b> Tipos de compra visibles en el catálogo.</li>"
        + "<li><b>Bitácora.</b> Eventos auditados; solo lectura.</li>"
        + "</ul>",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#admin-kpis",
    popover: {
      title: "Indicadores",
      description:
        "Las tarjetas resumen la carga del portal: cuentas en revisión, usuarios activos, "
        + "modalidades publicadas y volumen de auditoría.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#admin-kpi-revision",
    popover: {
      title: "Cuentas en revisión",
      description:
        "Si hay solicitantes pendientes, el botón <b>Revisar solicitudes</b> abre la bandeja de aprobación. "
        + "Ahí apruebas o rechazas el acceso antes de que puedan enviar precios al INE.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#admin-accesos",
    popover: {
      title: "Accesos activos",
      description:
        "Muestra cuántas sesiones hay por rol (solicitante, proveedor, trabajador, etc.). "
        + "Sirve para detectar picos de uso o roles poco frecuentes.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#admin-recientes",
    popover: {
      title: "Usuarios y bitácora recientes",
      description:
        "Abajo ves las últimas cuentas creadas y los eventos auditados más recientes. "
        + "Usa el menú lateral para listados completos con búsqueda y paginación.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#admin-tutorial",
    popover: {
      title: "Volver a ver el tutorial",
      description: "Puedes repetir este recorrido cuando lo necesites, en computadora o teléfono.",
      side: "bottom",
      align: "start",
    },
  },
];

const { runTour, useTourAuto } = crearTour({
  clave: CLAVE,
  pasos: PASOS,
  selectoresListo: ["#admin-intro", "#admin-nav", "#admin-kpis"],
});

export const runTourAdmin = runTour;
export const useTourAdmin = useTourAuto;