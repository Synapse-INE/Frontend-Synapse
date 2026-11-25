import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import "./tourProveedor.css";

const CLAVE = "dpir.tour.proveedor";

const PASOS = [
  {
    element: "#prov-titulo",
    popover: {
      title: "Para qué sirve esta pantalla",
      description:
        "Aquí se lleva el catálogo del proveedor: cada producto que ofrece y el precio vigente. El precio se guarda con el IVA del 12 % incluido, en quetzales. La vigencia corre seis meses desde la fecha de ese monto. Al vencer, se confirma o se cambia para que el catálogo siga disponible.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#prov-agregar",
    popover: {
      title: "Agregar un producto",
      description:
        "Este botón abre el formulario de un producto nuevo. El formulario pide:"
        + "<ul>"
        + "<li><b>Nombre y descripción.</b> Identifican el producto y lo distinguen de otros parecidos.</li>"
        + "<li><b>Presentación y categoría.</b> La presentación es unidad, resma, ciento o caja. La categoría se escribe en texto libre, como se ofrece el producto.</li>"
        + "<li><b>Atributos.</b> Marca, modelo y especificación. Describen el producto y no se suman al precio.</li>"
        + "<li><b>Precio con IVA.</b> Un solo monto, en quetzales. Si falta el nombre, la descripción, la categoría o el precio, el campo se marca y no se guarda.</li>"
        + "<li><b>Fechas.</b> La fecha de carga queda fija. La vigencia del precio corre seis meses desde la fecha de ese monto.</li>"
        + "</ul>",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: "#prov-resumen",
    popover: {
      title: "Las cuatro tarjetas",
      description:
        "Cada tarjeta filtra la lista y muestra cuántos productos hay en ese grupo."
        + "<ul>"
        + "<li><b>Productos.</b> El catálogo completo.</li>"
        + "<li><b>Vigentes.</b> El precio sigue dentro de los seis meses de vigencia.</li>"
        + "<li><b>Por confirmar.</b> La vigencia ya venció y el precio espera confirmación o un monto nuevo.</li>"
        + "<li><b>Requieren acción.</b> Reúne todo lo que no está vigente, para atenderlo primero.</li>"
        + "</ul>",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#prov-buscar",
    popover: {
      title: "Buscar",
      description:
        "El buscador recorre el código, el nombre y la descripción. La lista se reduce a lo que coincide. Los productos que no aparecen siguen en el catálogo: al borrar la búsqueda se vuelven a ver.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#prov-presentacion",
    popover: {
      title: "Filtrar por presentación",
      description:
        "Este filtro deja solo una forma de entrega: unidad, resma, ciento o caja. Con Todas se vuelve a ver el catálogo completo. Se puede combinar con la búsqueda y con las tarjetas de estado.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#prov-leyenda",
    popover: {
      title: "El ciclo del precio",
      description:
        "La leyenda resume qué pasa con un precio a lo largo del tiempo."
        + "<ul>"
        + "<li><b>Vigente.</b> La fecha del precio más seis meses aún no se cumple.</li>"
        + "<li><b>Por confirmar.</b> Esa vigencia ya venció.</li>"
        + "<li><b>Confirmar o cambiar.</b> Se agrega otra fila al historial y la vigencia vuelve a correr seis meses.</li>"
        + "</ul>",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#prov-ejemplo",
    popover: {
      title: "Cómo se lee una fila",
      description:
        "Cada fila es un producto. Al pulsar el título de una columna, la tabla se ordena."
        + "<ul>"
        + "<li><b>Código.</b> Identifica el producto dentro del catálogo.</li>"
        + "<li><b>Producto y descripción.</b> El nombre y el detalle. La descripción larga se corta en la fila; en la ficha se lee completa.</li>"
        + "<li><b>Presentación.</b> La unidad en la que se ofrece.</li>"
        + "<li><b>Precio c/IVA.</b> El monto vigente, con el IVA incluido, en quetzales.</li>"
        + "<li><b>Fecha del precio.</b> La fecha del último monto. No es la fecha de la primera carga.</li>"
        + "</ul>",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#prov-estado",
    popover: {
      title: "El estado de la fila",
      description:
        "La etiqueta resume la vigencia de ese precio: vigente o por confirmar. En Ver se explica qué significa y se ven la fecha de carga, la fecha del precio y hasta cuándo corre la vigencia.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#prov-acciones",
    popover: {
      title: "Ver, editar y confirmar",
      description:
        "<ul>"
        + "<li><b>Ver.</b> Abre la ficha: estado, presentación, categoría, precio con IVA, moneda, fecha de carga, fecha del precio, vigencia, descripción, atributos e historial. El historial guarda cada monto, su fecha, la moneda y la vigencia.</li>"
        + "<li><b>Editar.</b> Abre el mismo formulario, con los datos ya escritos. Si el precio cambia, se agrega una fila al historial y la vigencia vuelve a empezar. Si solo cambian la descripción o los atributos, el precio y su fecha siguen igual.</li>"
        + "<li><b>Confirmar.</b> Solo aparece cuando el precio no está vigente. Agrega el mismo monto con la fecha de hoy y abre otra vigencia de seis meses.</li>"
        + "</ul>",
      side: "top",
      align: "end",
    },
  },
  {
    element: "#prov-tutorial",
    popover: {
      title: "Volver a ver el tutorial",
      description:
        "Este botón abre de nuevo el recorrido completo, en la computadora y en el teléfono, cuando se necesita consultarlo otra vez.",
      side: "bottom",
      align: "start",
    },
  },
];

let recorrido = null;

function visto() {
  try {
    return localStorage.getItem(CLAVE) === "1";
  } catch {
    return true;
  }
}

function marcarVisto() {
  try {
    localStorage.setItem(CLAVE, "1");
  } catch {
    /* El navegador puede bloquear el almacenamiento. El recorrido igual se puede abrir con el botón. */
  }
}

function pasosVisibles() {
  return PASOS.filter((paso) => document.querySelector(paso.element));
}

export function runTourProveedor({ recordar = false } = {}) {
  const steps = pasosVisibles();
  if (!steps.length) return;
  let alCerrar = recordar ? marcarVisto : null;
  recorrido?.destroy();
  const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tour = driver({
    animate: !reducir,
    smoothScroll: false,
    showProgress: steps.length > 1,
    progressText: "{{current}} de {{total}}",
    nextBtnText: "Siguiente",
    prevBtnText: "Atrás",
    doneBtnText: "Entendido",
    popoverClass: "dpir-tour",
    overlayOpacity: 0.55,
    stagePadding: 6,
    stageRadius: 12,
    onDestroyed: () => {
      if (recorrido === tour) recorrido = null;
      const cierre = alCerrar;
      alCerrar = null;
      cierre?.();
    },
    steps,
  });
  recorrido = tour;
  document.querySelector(steps[0].element)?.scrollIntoView({ block: "center", behavior: "auto" });
  requestAnimationFrame(() => {
    requestAnimationFrame(() => tour.drive());
  });
}

export function useTourProveedor() {
  useEffect(() => {
    if (visto()) return undefined;
    let cancelado = false;
    const id = window.setTimeout(() => {
      if (cancelado || visto()) return;
      const listo = ["#prov-titulo", "#prov-agregar", "#prov-resumen", "#prov-herramientas"].every((sel) =>
        document.querySelector(sel)
      );
      if (!listo) return;
      runTourProveedor({ recordar: true });
    }, 500);
    return () => {
      cancelado = true;
      window.clearTimeout(id);
    };
  }, []);
}
