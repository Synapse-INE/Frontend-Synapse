import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { InicioPage } from "../features/inicio/InicioPage";
import { ListaPreciosPage } from "../features/precios/ListaPreciosPage";
import { SolicitudPage } from "../features/solicitud/SolicitudPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<InicioPage />} />
          <Route path="lista" element={<ListaPreciosPage />} />
          <Route path="solicitud" element={<SolicitudPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
