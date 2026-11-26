import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { cerrarSesion, iniciarSesion, restaurarSesion } from "../servicios/sesionApi";

const SesionContext = createContext(null);

export function SesionProvider({ children }) {
  const [sesion, setSesion] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let viva = true;
    restaurarSesion()
      .then((siguiente) => {
        if (viva) setSesion(siguiente);
      })
      .catch(() => {
        if (viva) setSesion(null);
      })
      .finally(() => {
        if (viva) setCargando(false);
      });
    return () => {
      viva = false;
    };
  }, []);

  const entrar = useCallback(async (correo, clave) => {
    const siguiente = await iniciarSesion(correo, clave);
    setSesion(siguiente);
    return siguiente;
  }, []);

  const salir = useCallback(async () => {
    await cerrarSesion();
    setSesion(null);
  }, []);

  const valor = useMemo(
    () => ({ sesion, cargando, entrar, salir }),
    [sesion, cargando, entrar, salir],
  );

  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}

export function useSesion() {
  const contexto = useContext(SesionContext);
  if (!contexto) throw new Error("useSesion debe usarse dentro de SesionProvider");
  return contexto;
}
