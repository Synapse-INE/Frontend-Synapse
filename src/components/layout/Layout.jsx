import { Outlet, useLocation } from "react-router-dom";
import { usePersistirScroll } from "../../hooks/usePersistirScroll";
import { useRevelar } from "../../hooks/useRevelar";
import { Barra } from "./Barra";
import { Pie } from "./Pie";

export function Layout() {
  const { pathname } = useLocation();
  usePersistirScroll();
  useRevelar(pathname);

  return (
    <div className="app">
      <a className="saltar" href="#contenido">
        Saltar al contenido
      </a>
      <Barra />
      <main id="contenido">
        <Outlet />
      </main>
      <Pie />
    </div>
  );
}
