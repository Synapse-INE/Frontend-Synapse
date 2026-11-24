import { useEffect } from "react";

function enPantalla(el) {
  const caja = el.getBoundingClientRect();
  return caja.bottom > 0 && caja.top < window.innerHeight + 40 && caja.height > 0;
}

export function useRevelar(dependencia) {
  useEffect(() => {
    const nodos = [...document.querySelectorAll(".revelar")];
    if (!nodos.length) return undefined;

    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducir) {
      nodos.forEach((el) => el.classList.add("es-visible"));
      return undefined;
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (!entrada.isIntersecting) return;
          entrada.target.classList.add("es-visible");
          observador.unobserve(entrada.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -4% 0px" }
    );

    nodos.forEach((el) => {
      if (enPantalla(el)) {
        el.classList.add("es-visible");
      } else {
        observador.observe(el);
      }
    });

    return () => observador.disconnect();
  }, [dependencia]);
}
