import { createContext, useContext } from "react";

export const SesionContext = createContext(null);

export function useSesion() {
  const valor = useContext(SesionContext);
  if (!valor) throw new Error("useSesion debe usarse dentro de <SesionProvider>");
  return valor;
}

export function rutaDeInicio(rol) {
  return rol === "personal" ? "/personal" : "/proveedor";
}
