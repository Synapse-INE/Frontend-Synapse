import { useEffect } from "react";

function enPantalla(el) {
  const caja = el.getBoundingClientRect();
  return caja.bottom > 0 && caja.top < window.innerHeight + 40 && caja.height > 0;
}

export function useRevelar(dependencia) {
  useEffect(() => {
    const root = document.getElementById("contenido");
    if (!root) return undefined;

    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observador = reducir
      ? null
      : new IntersectionObserver(
          (entradas) => {
            entradas.forEach((entrada) => {
              if (!entrada.isIntersecting) return;
              entrada.target.classList.add("es-visible");
              observador?.unobserve(entrada.target);
            });
          },
          { threshold: 0.12, rootMargin: "0px 0px -4% 0px" },
        );

    function marcar(nodos) {
      nodos.forEach((el) => {
        if (el.classList.contains("es-visible")) return;
        if (reducir || enPantalla(el)) {
          el.classList.add("es-visible");
          return;
        }
        observador?.observe(el);
      });
    }

    function escanear() {
      marcar([...root.querySelectorAll(".revelar")]);
    }

    escanear();
    const mutaciones = new MutationObserver(escanear);
    mutaciones.observe(root, { childList: true, subtree: true });

    return () => {
      mutaciones.disconnect();
      observador?.disconnect();
    };
  }, [dependencia]);
}