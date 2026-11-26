import { Navigate, Outlet, useLocation } from "react-router-dom";
import { rutaDeInicio, useSesion } from "./sesion";

// Deja pasar solo a quien tiene sesión y, si se indica, el rol correcto.
export function RutaProtegida({ rol }) {
  const { usuario } = useSesion();
  const ubicacion = useLocation();

  if (!usuario) return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
  if (rol && usuario.rol !== rol) return <Navigate to={rutaDeInicio(usuario.rol)} replace />;
  return <Outlet />;
}
