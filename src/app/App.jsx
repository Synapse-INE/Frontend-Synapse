import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { InicioPage } from "../features/inicio/InicioPage";
import { InicioPersonalPage } from "../features/portal/InicioPersonalPage";
import { InicioProveedorPage } from "../features/portal/InicioProveedorPage";
import { LoginPage } from "../features/portal/LoginPage";
import { RutaProtegida } from "../features/portal/RutaProtegida";
import { SesionProvider } from "../features/portal/SesionProvider";
import { ListaPreciosPage } from "../features/precios/ListaPreciosPage";
import { SolicitudPage } from "../features/solicitud/SolicitudPage";

export function App() {
  return (
    <BrowserRouter>
      <SesionProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<InicioPage />} />
            <Route path="lista" element={<ListaPreciosPage />} />
            <Route path="solicitud" element={<SolicitudPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route element={<RutaProtegida rol="proveedor" />}>
              <Route path="proveedor" element={<InicioProveedorPage />} />
            </Route>
            <Route element={<RutaProtegida rol="personal" />}>
              <Route path="personal" element={<InicioPersonalPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </SesionProvider>
    </BrowserRouter>
  );
}
