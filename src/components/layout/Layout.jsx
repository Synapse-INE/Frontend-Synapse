import { Outlet, useLocation } from "react-router-dom";
import { usePersistirScroll } from "../../hooks/usePersistirScroll";
import { useRevelar } from "../../hooks/useRevelar";
import { useSesion } from "../../sesion/Sesion";
import { Barra } from "./Barra";
import { Pie } from "./Pie";

const SIN_PIE = ["/ingresar", "/registro"];

export function Layout() {
  const { pathname } = useLocation();
  const { sesion } = useSesion();
  usePersistirScroll();
  useRevelar(pathname);
  const bandejaMesa = pathname.startsWith("/personal") && ["jefe", "admin", "trabajador"].includes(sesion?.rol);
  const sinPie = SIN_PIE.includes(pathname) || bandejaMesa;
  const esPanel = pathname.startsWith("/admin");

  if (esPanel) {
    return (
      <div className="app app--panel">
        <a className="saltar" href="#contenido">Saltar al contenido</a>
        <main id="contenido">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <a className="saltar" href="#contenido">
        Saltar al contenido
      </a>
      <Barra />
      <main id="contenido">
        <Outlet />
      </main>
      {sinPie ? null : <Pie />}
    </div>
  );
}
