import { createContext, useContext, useMemo, useState } from "react";
import { estaBloqueada, sesionValida } from "./roles";

const CLAVE = "dpir.sesion";
const SesionContext = createContext(null);

function leer() {
  try {
    const texto = localStorage.getItem(CLAVE);
    const sesion = texto ? sesionValida(JSON.parse(texto)) : null;
    if (sesion && estaBloqueada(sesion.correo)) return null;
    return sesion;
  } catch {
    return null;
  }
}

export function SesionProvider({ children }) {
  const [sesion, setSesion] = useState(leer);

  const valor = useMemo(
    () => ({
      sesion,
      entrar(cuenta) {
        const siguiente = sesionValida(cuenta);
        if (!siguiente) return;
        setSesion(siguiente);
        try {
          localStorage.setItem(CLAVE, JSON.stringify(siguiente));
        } catch {
          /* La sesión queda en memoria si el navegador bloquea el almacenamiento. */
        }
      },
      salir() {
        setSesion(null);
        try {
          localStorage.removeItem(CLAVE);
        } catch {
          /* Nada que limpiar. */
        }
      },
    }),
    [sesion]
  );

  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}

export function useSesion() {
  const valor = useContext(SesionContext);
  if (!valor) throw new Error("useSesion se usa dentro de SesionProvider");
  return valor;
}
