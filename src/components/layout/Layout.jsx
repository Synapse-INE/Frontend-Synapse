import { Outlet, useLocation } from "react-router-dom";
import { usePersistirScroll } from "../../hooks/usePersistirScroll";
import { useRevelar } from "../../hooks/useRevelar";
import { Barra } from "./Barra";
import { Pie } from "./Pie";

const SIN_PIE = ["/ingresar", "/registro"];

export function Layout() {
  const { pathname } = useLocation();
  usePersistirScroll();
  useRevelar(pathname);
  const sinPie = SIN_PIE.includes(pathname);
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
