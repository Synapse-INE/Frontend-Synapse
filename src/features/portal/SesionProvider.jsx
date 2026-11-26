import { useCallback, useMemo, useState } from "react";
import { iniciarSesion } from "../../servicios/portal";
import { SesionContext } from "./sesion";

const CLAVE_ALMACEN = "ine-portal-sesion";

// "Recordarme" guarda la sesión en localStorage; si no, solo dura mientras la pestaña esté abierta.
// Con el servidor real esto lo reemplaza una cookie httpOnly: aquí solo se guarda el perfil, nunca la contraseña.
function leerGuardada() {
  for (const almacen of ["localStorage", "sessionStorage"]) {
    try {
      const guardada = JSON.parse(window[almacen].getItem(CLAVE_ALMACEN));
      if (guardada) return guardada;
    } catch {
      /* almacenamiento no disponible */
    }
  }
  return null;
}

function guardar(usuario, recordar) {
  try {
    sessionStorage.removeItem(CLAVE_ALMACEN);
    localStorage.removeItem(CLAVE_ALMACEN);
    if (usuario) (recordar ? localStorage : sessionStorage).setItem(CLAVE_ALMACEN, JSON.stringify(usuario));
  } catch {
    /* sin almacenamiento: la sesión dura mientras la pestaña siga abierta */
  }
}

export function SesionProvider({ children }) {
  const [usuario, setUsuario] = useState(leerGuardada);

  const entrar = useCallback(async ({ recordar = false, ...credenciales }) => {
    const datos = await iniciarSesion(credenciales);
    guardar(datos, recordar);
    setUsuario(datos);
    return datos;
  }, []);

  const salir = useCallback(() => {
    guardar(null);
    setUsuario(null);
  }, []);

  const valor = useMemo(() => ({ usuario, entrar, salir }), [usuario, entrar, salir]);
  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}
