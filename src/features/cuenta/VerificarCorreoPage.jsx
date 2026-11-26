import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ApiError } from "../../servicios/api";
import { verificarCorreo } from "../../servicios/sesionApi";
import { AccesoMarco } from "./AccesoMarco";

const verificaciones = new Map();

function verificarUnaVez(token) {
  const previa = verificaciones.get(token);
  if (previa) return previa;
  const promesa = verificarCorreo(token).catch((error) => {
    verificaciones.delete(token);
    throw error;
  });
  verificaciones.set(token, promesa);
  return promesa;
}

export function VerificarCorreoPage() {
  const [parametros] = useSearchParams();
  const token = parametros.get("token") || "";
  const [estado, setEstado] = useState(token ? "revisando" : "faltante");
  const [detalle, setDetalle] = useState("");

  useEffect(() => {
    if (!token) return undefined;
    let viva = true;
    verificarUnaVez(token)
      .then(() => {
        if (viva) setEstado("listo");
      })
      .catch((fallo) => {
        if (!viva) return;
        setEstado("error");
        setDetalle(fallo instanceof ApiError ? fallo.detail : "No se pudo verificar el correo.");
      });
    return () => {
      viva = false;
    };
  }, [token]);

  return (
    <AccesoMarco titulo="Verificación del correo." texto="La cuenta sigue pendiente hasta que un administrador del INE la apruebe.">
      <p className="etiqueta">Acceso</p>
      <h2>Correo</h2>
      {estado === "revisando" ? <p className="acceso__lead">Estamos confirmando el enlace.</p> : null}
      {estado === "listo" ? <p className="acceso__ok" role="status">El correo quedó verificado. El ingreso se habilita cuando el INE aprueba la cuenta.</p> : null}
      {estado === "faltante" ? <p className="acceso__error" role="alert">El enlace no trae el token de verificación.</p> : null}
      {estado === "error" ? <p className="acceso__error" role="alert">{detalle}</p> : null}
      <p className="acceso__cambio"><Link to="/ingresar">Ir a ingresar</Link></p>
    </AccesoMarco>
  );
}
