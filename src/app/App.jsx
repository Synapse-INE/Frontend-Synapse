import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { AdminPage } from "../features/admin/AdminPage";
import { CuentaPage } from "../features/cuenta/CuentaPage";
import { IngresoPage } from "../features/cuenta/IngresoPage";
import { RegistroPage } from "../features/cuenta/RegistroPage";
import { InicioPage } from "../features/inicio/InicioPage";
import { ListaPreciosPage } from "../features/precios/ListaPreciosPage";
import { SolicitudPage } from "../features/solicitud/SolicitudPage";
import { ProveedorPage } from "../features/proveedor/ProveedorPage";
import { RutaInvitado, RutaProtegida } from "../sesion/RutaProtegida";
import { SesionProvider } from "../sesion/Sesion";

export function App() {
  return (
    <BrowserRouter>
      <SesionProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<InicioPage />} />
            <Route path="lista" element={<ListaPreciosPage />} />
            <Route path="solicitud" element={<RutaProtegida roles={["solicitante"]}><SolicitudPage /></RutaProtegida>} />
            <Route path="proveedor" element={<RutaProtegida roles={["proveedor"]}><ProveedorPage /></RutaProtegida>} />
            <Route path="ingresar" element={<RutaInvitado><IngresoPage /></RutaInvitado>} />
            <Route path="registro" element={<RutaInvitado><RegistroPage /></RutaInvitado>} />
            <Route path="cuenta" element={<RutaProtegida><CuentaPage /></RutaProtegida>} />
            <Route path="admin" element={<RutaProtegida roles={["admin"]}><AdminPage /></RutaProtegida>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </SesionProvider>
    </BrowserRouter>
  );
}
