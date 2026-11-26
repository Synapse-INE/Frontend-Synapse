import { useEffect, useState } from "react";
import { ApiError } from "../../servicios/api";
import { avisosActualizados } from "../../servicios/avisosUi";
import { confirmarAvisoPrecio, listarAvisosPrecio } from "./proveedorApi";
import "./avisosPrecio.css";

function restante(venceEn) {
  const ms = new Date(venceEn).getTime() - Date.now();
  if (ms <= 0) return "Plazo vencido";
  const horas = Math.ceil(ms / 3_600_000);
  if (horas < 24) return `Quedan ${horas} h`;
  const dias = Math.floor(horas / 24);
  const resto = horas % 24;
  return resto ? `Quedan ${dias} d ${resto} h` : `Quedan ${dias} d`;
}

/** `version` cambia cuando el proveedor guarda un precio, para recargar los avisos ya atendidos. */
export function AvisosPrecio({ version = 0 }) {
  const [avisos, setAvisos] = useState([]);
  const [ocupado, setOcupado] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let viva = true;
    listarAvisosPrecio()
      .then((datos) => { if (viva) setAvisos(datos.avisos || []); })
      .catch(() => { if (viva) setAvisos([]); });
    return () => { viva = false; };
  }, [version]);

  async function confirmar(id) {
    setOcupado(id);
    setError("");
    try {
      const datos = await confirmarAvisoPrecio(id);
      setAvisos(datos.avisos || []);
      avisosActualizados();
    } catch (fallo) {
      setError(fallo instanceof ApiError ? fallo.detail || fallo.message : "No se pudo confirmar.");
    } finally {
      setOcupado("");
    }
  }

  if (avisos.length === 0) return null;

  return (
    <section className="avisos-precio" aria-label="Solicitudes que esperan tus precios">
      <header className="avisos-precio__cabeza">
        <span className="avisos-precio__punto" aria-hidden="true" />
        <div>
          <h3>El INE espera tus precios actualizados</h3>
          <p>
            Actualiza o confirma tus precios dentro de los 2 días. Cambiar o confirmar cualquier precio del catálogo
            atiende todas las solicitudes; si tus precios ya están al día, confírmalo aquí.
          </p>
        </div>
      </header>
      {error ? <p className="avisos-precio__error" role="alert">{error}</p> : null}
      <ul className="avisos-precio__lista">
        {avisos.map((aviso) => (
          <li key={aviso.id}>
            <div className="avisos-precio__info">
              <span className="avisos-precio__codigo">{aviso.codigo}</span>
              <strong>{aviso.titulo}</strong>
              {aviso.productos?.length ? (
                <span className="avisos-precio__productos">
                  {aviso.productos.slice(0, 4).join(" · ")}{aviso.productos.length > 4 ? " …" : ""}
                </span>
              ) : null}
            </div>
            <span className="avisos-precio__plazo">{restante(aviso.venceEn)}</span>
            <button
              type="button"
              className="btn btn--linea btn--chico"
              disabled={ocupado === aviso.id}
              onClick={() => confirmar(aviso.id)}
            >
              {ocupado === aviso.id ? "Guardando…" : "Mis precios están al día"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
