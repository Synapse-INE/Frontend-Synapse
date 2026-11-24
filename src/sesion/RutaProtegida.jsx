import { Navigate } from "react-router-dom";
import { ROLES } from "./roles";
import { useSesion } from "./Sesion";

function destinoDe(sesion) {
  return ROLES[sesion?.rol]?.destino || "/cuenta";
}

export function RutaProtegida({ roles, children }) {
  const { sesion } = useSesion();
  if (!sesion) return <Navigate to="/ingresar" replace />;
  if (roles && !roles.includes(sesion.rol)) return <Navigate to={destinoDe(sesion)} replace />;
  return children;
}

export function RutaInvitado({ children }) {
  const { sesion } = useSesion();
  if (sesion) return <Navigate to={destinoDe(sesion)} replace />;
  return children;
}
