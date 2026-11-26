import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import "./dpirTour.css";

let recorridoActivo = null;

export function tourVisto(clave) {
  try {
    return localStorage.getItem(clave) === "1";
  } catch {
    return true;
  }
}

function marcarVisto(clave) {
  try {
    localStorage.setItem(clave, "1");
  } catch {
    /* almacenamiento bloqueado */
  }
}

function pasosVisibles(pasos) {
  return pasos.filter((paso) => !paso.element || document.querySelector(paso.element));
}

export function ejecutarTour({ clave, pasos, recordar = false }) {
  const steps = pasosVisibles(pasos);
  if (!steps.length) return;
  let alCerrar = recordar ? () => marcarVisto(clave) : null;
  recorridoActivo?.destroy();
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
        if (recorridoActivo === tour) recorridoActivo = null;
        const cierre = alCerrar;
        alCerrar = null;
        cierre?.();
      },
      steps,
    });
  recorridoActivo = tour;
  const ancla = steps[0].element ? document.querySelector(steps[0].element) : null;
  ancla?.scrollIntoView({ block: "center", behavior: "auto" });
  requestAnimationFrame(() => {
    requestAnimationFrame(() => tour.drive());
  });
}

export function crearTour({ clave, pasos, selectoresListo = [] }) {
  function runTour(opciones) {
    ejecutarTour({ clave, pasos, ...opciones });
  }

  function useTourAuto(deps = []) {
    useEffect(() => {
      if (tourVisto(clave)) return undefined;
      let cancelado = false;
      const id = window.setTimeout(() => {
        if (cancelado || tourVisto(clave)) return;
        const listo = selectoresListo.length === 0
          || selectoresListo.every((sel) => document.querySelector(sel));
        if (!listo) return;
        runTour({ recordar: true });
      }, 500);
      return () => {
        cancelado = true;
        window.clearTimeout(id);
      };
    }, deps);
  }

  return { runTour, useTourAuto };
}