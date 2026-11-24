import { useEffect, useRef } from "react";

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
// Clave de pruebas de Cloudflare (siempre pasa). En producción: VITE_TURNSTILE_SITE_KEY.
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA";

function cargarScript() {
  if (window.turnstile) return Promise.resolve();
  if (!window.__turnstileCarga) {
    window.__turnstileCarga = new Promise((ok, fallo) => {
      const s = document.createElement("script");
      s.src = SCRIPT;
      s.async = true;
      s.onload = ok;
      s.onerror = fallo;
      document.head.appendChild(s);
    });
  }
  return window.__turnstileCarga;
}

// Widget de verificación. Llama onToken(token) al pasar y onToken(null) si vence o falla.
// Cambiar "reiniciar" (un número) vuelve a dibujar el widget, por ejemplo tras un envío fallido.
export function Turnstile({ onToken, reiniciar = 0 }) {
  const caja = useRef(null);

  useEffect(() => {
    let idWidget = null;
    let activo = true;

    cargarScript()
      .then(() => {
        if (!activo || !caja.current) return;
        idWidget = window.turnstile.render(caja.current, {
          sitekey: SITE_KEY,
          callback: onToken,
          "expired-callback": () => onToken(null),
          "error-callback": () => onToken(null),
        });
      })
      .catch(() => onToken(null));

    return () => {
      activo = false;
      if (idWidget !== null && window.turnstile) window.turnstile.remove(idWidget);
    };
  }, [reiniciar]);

  return <div ref={caja} />;
}
