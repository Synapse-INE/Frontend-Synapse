import { useEffect, useMemo, useState } from "react";
import { buscarPublicacion } from "../servicios/catalogo";
import { estadisticasDe } from "../servicios/estadisticas";

export function usePublicacion(consulta) {
  const clave = JSON.stringify(consulta);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError("");
    buscarPublicacion(consulta)
      .then((datos) => {
        if (!vigente) return;
        setItems(Array.isArray(datos) ? datos : []);
      })
      .catch(() => {
        if (!vigente) return;
        setItems([]);
        setError("No se pudo completar la consulta. Inténtalo de nuevo.");
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [clave]);

  const estadisticas = useMemo(() => estadisticasDe(items), [items]);
  return { items, error, cargando, estadisticas };
}
