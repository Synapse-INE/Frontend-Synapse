import { useMemo } from "react";
import { useSesion as useNuestra } from "../../sesion/Sesion";
import { SesionContext } from "./sesion";

// Las vistas nuevas leen { usuario } de su propio contexto.
// Aquí se arma ese perfil desde la sesión del portal, sin usar su login.
export function SesionPuente({ children }) {
  const { sesion, salir } = useNuestra();

  const usuario = useMemo(() => {
    if (!sesion) return null;
    if (sesion.rol === "proveedor") {
      return { rol: "proveedor", nombre: sesion.nombre, cargo: "Proveedor", proveedorId: "prov-01" };
    }
    if (sesion.rol === "trabajador" || sesion.rol === "admin") {
      return {
        rol: "personal",
        nombre: sesion.nombre,
        cargo: sesion.rol === "admin" ? "Administrador" : "Trabajador del INE",
      };
    }
    return null;
  }, [sesion]);

  const valor = useMemo(() => ({ usuario, entrar: async () => usuario, salir }), [usuario, salir]);
  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}
