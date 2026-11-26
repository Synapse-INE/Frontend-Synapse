import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { AdminPage } from "../features/admin/AdminPage";
import { CuentaPage } from "../features/cuenta/CuentaPage";
import { IngresoPage } from "../features/cuenta/IngresoPage";
import { RegistroPage } from "../features/cuenta/RegistroPage";
import { VerificarCorreoPage } from "../features/cuenta/VerificarCorreoPage";
import { AceptarInvitacionPage } from "../features/cuenta/AceptarInvitacionPage";
import { InicioPage } from "../features/inicio/InicioPage";
import { BandejaJefe, BandejaTrabajador } from "../features/jefe/BandejaJefe";
import { ListaPreciosPage } from "../features/precios/ListaPreciosPage";
import { SolicitudPage } from "../features/solicitud/SolicitudPage";
import { ProveedorPage } from "../features/proveedor/ProveedorPage";
import { RutaInvitado, RutaProtegida } from "../sesion/RutaProtegida";
import { SesionProvider, useSesion } from "../sesion/Sesion";

function VistaPersonal() {
  const { sesion } = useSesion();
  if (sesion?.rol === "jefe" || sesion?.rol === "admin") return <BandejaJefe />;
  return <BandejaTrabajador />;
}

export function App() {
  return (
    <BrowserRouter>
      <SesionProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<InicioPage />} />
            <Route path="lista" element={<ListaPreciosPage />} />
            <Route path="solicitud" element={<SolicitudPage />} />
            <Route path="proveedor" element={<RutaProtegida roles={["proveedor"]}><ProveedorPage /></RutaProtegida>} />
            <Route path="cotizaciones" element={<Navigate to="/proveedor" replace />} />
            <Route path="personal" element={<RutaProtegida roles={["jefe", "trabajador", "admin"]}><VistaPersonal /></RutaProtegida>} />
            <Route path="ingresar" element={<RutaInvitado><IngresoPage /></RutaInvitado>} />
            <Route path="registro" element={<RutaInvitado><RegistroPage /></RutaInvitado>} />
            <Route path="verificar-correo" element={<VerificarCorreoPage />} />
            <Route path="aceptar-invitacion" element={<AceptarInvitacionPage />} />
            <Route path="cuenta" element={<RutaProtegida><CuentaPage /></RutaProtegida>} />
            <Route path="admin" element={<RutaProtegida roles={["admin"]}><AdminPage /></RutaProtegida>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </SesionProvider>
    </BrowserRouter>
  );
}
