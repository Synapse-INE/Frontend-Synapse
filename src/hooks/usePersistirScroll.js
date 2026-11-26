import { useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const CLAVE = "ine-dpir-scroll";

function rutaActual() {
  return `${window.location.pathname}${window.location.search}`;
}

function leerGuardado() {
  try {
    const bruto = sessionStorage.getItem(CLAVE);
    if (!bruto) return null;
    const dato = JSON.parse(bruto);
    if (!dato || typeof dato.ruta !== "string" || typeof dato.y !== "number") return null;
    return dato;
  } catch {
    return null;
  }
}

function guardar(y = window.scrollY) {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify({ ruta: rutaActual(), y: Math.max(0, y) }));
  } catch {
    /* sessionStorage lleno o bloqueado */
  }
}

function irA(y) {
  const html = document.documentElement;
  const anterior = html.style.scrollBehavior;
  html.style.scrollBehavior = "auto";
  window.scrollTo({ left: 0, top: y });
  html.style.scrollBehavior = anterior;
}

export function usePersistirScroll() {
  const { pathname, search } = useLocation();
  const ruta = `${pathname}${search}`;
  const rutaPrevia = useRef(null);

  useLayoutEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    const alOcultar = () => guardar();
    let espera;
    const alScroll = () => {
      clearTimeout(espera);
      espera = setTimeout(() => guardar(), 80);
    };

    window.addEventListener("pagehide", alOcultar);
    window.addEventListener("beforeunload", alOcultar);
    window.addEventListener("scroll", alScroll, { passive: true });

    return () => {
      clearTimeout(espera);
      window.removeEventListener("pagehide", alOcultar);
      window.removeEventListener("beforeunload", alOcultar);
      window.removeEventListener("scroll", alScroll);
    };
  }, []);

  useLayoutEffect(() => {
    if (rutaPrevia.current === null) {
      rutaPrevia.current = ruta;
      const guardado = leerGuardado();
      if (!guardado || guardado.ruta !== ruta || guardado.y < 1) return undefined;

      const aplicar = () => irA(guardado.y);
      aplicar();
      const marco = requestAnimationFrame(aplicar);
      const t1 = setTimeout(aplicar, 80);
      const t2 = setTimeout(aplicar, 280);
      return () => {
        cancelAnimationFrame(marco);
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }

    if (rutaPrevia.current !== ruta) {
      rutaPrevia.current = ruta;
      irA(0);
      guardar(0);
      document.documentElement.scrollLeft = 0;
      document.body.scrollLeft = 0;
    }
    return undefined;
  }, [ruta]);
}
