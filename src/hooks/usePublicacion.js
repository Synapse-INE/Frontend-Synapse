import { useEffect, useMemo, useState } from "react";
import { buscarPublicacion } from "../servicios/catalogo";

export function usePublicacion(consulta, pagina = 1) {
  const clave = JSON.stringify(consulta);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [meta, setMeta] = useState({ total: 0, vigentes: 0, pagina: 1, paginas: 1 });

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError("");
    buscarPublicacion(consulta, { limite: 10, pagina })
      .then((datos) => {
        if (!vigente) return;
        setItems(datos.items);
        setMeta({
          total: datos.total,
          vigentes: datos.vigentes,
          pagina: datos.pagina,
          paginas: datos.paginas,
        });
      })
      .catch(() => {
        if (!vigente) return;
        setItems([]);
        setMeta({ total: 0, vigentes: 0, pagina: 1, paginas: 1 });
        setError("No se pudo completar la consulta. Inténtalo de nuevo.");
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [clave, pagina]);

  const indicadores = useMemo(() => [
    {
      id: "coincidencias",
      etiqueta: "Coincidencias",
      valor: meta.total.toLocaleString("es-GT"),
      barra: meta.total ? 100 : 0,
    },
    {
      id: "vigentes",
      etiqueta: "Siguen vigentes",
      valor: meta.vigentes.toLocaleString("es-GT"),
      barra: meta.total ? Math.round((meta.vigentes / meta.total) * 100) : 0,
    },
    {
      id: "pagina",
      etiqueta: "Página",
      valor: `${meta.pagina} de ${meta.paginas}`,
      barra: meta.paginas ? Math.round((meta.pagina / meta.paginas) * 100) : 0,
    },
  ], [meta]);

  return { items, error, cargando, indicadores, ...meta };
}
