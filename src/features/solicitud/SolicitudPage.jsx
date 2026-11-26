import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Contenedor } from "../../components/ui/Contenedor";
import { Etiqueta } from "../../components/ui/Etiqueta";
import { useSesion } from "../../sesion/Sesion";
import { AvisoCuentaSolicitud } from "./AvisoCuentaSolicitud";
import { runTourSolicitud } from "../../tours/tourSolicitud";
import { FormularioSolicitud } from "./FormularioSolicitud";

export function SolicitudPage() {
  const { sesion, cargando } = useSesion();
  const navigate = useNavigate();

  useEffect(() => {
    if (window.scrollX !== 0) {
      window.scrollTo({ left: 0, top: window.scrollY });
    }
  }, []);

  if (cargando) {
    return (
      <section className="pagina solicitud">
        <p className="acceso__lead">Revisando la sesión…</p>
      </section>
    );
  }

  if (sesion?.rol !== "solicitante") {
    return (
      <AvisoCuentaSolicitud
        sesion={sesion}
        onCerrar={(motivo) => {
          if (motivo === "salida") return;
          if (window.location.pathname !== "/solicitud") return;
          if (window.history.state?.idx > 0) navigate(-1);
          else navigate("/", { replace: true });
        }}
      />
    );
  }

  return (
    <section className="pagina solicitud">
      <Contenedor className="solicitud__caja">
        <FormularioSolicitud
          intro={
            <div className="sol-info" id="sol-intro">
              <Etiqueta naranja>Solicitud de precios</Etiqueta>
              <div className="sol-info__titulo" id="sol-info-titulo">
                <h2>Pide un precio de referencia al INE</h2>
                <button type="button" className="mesa-tutorial" id="sol-tutorial" onClick={() => runTourSolicitud()}>
                  Tutorial
                </button>
              </div>
              <p>
                La autoridad contratante debe enviar un oficio a la máxima autoridad del Instituto, cumpliendo forma y
                especificaciones del reglamento de la modalidad.
              </p>
            </div>
          }
        />
      </Contenedor>
    </section>
  );
}
