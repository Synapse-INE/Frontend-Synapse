import { useEffect, useState } from "react";
import { buscarPublicacion, listarCategoriasPublicas } from "../servicios/catalogo";

let cacheCategorias = null;
let vueloCategorias = null;

export function useCategoriasPublicacion() {
  const [categorias, setCategorias] = useState(cacheCategorias || []);
  const [cargando, setCargando] = useState(!cacheCategorias);

  useEffect(() => {
    if (cacheCategorias) return undefined;
    vueloCategorias ??= listarCategoriasPublicas()
      .then((lista) => {
        cacheCategorias = lista;
        return lista;
      })
      .catch((error) => {
        vueloCategorias = null;
        throw error;
      });
    let vigente = true;
    vueloCategorias
      .then((lista) => {
        if (!vigente) return;
        setCategorias(lista);
        setCargando(false);
      })
      .catch(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, []);

  return { categorias, cargando };
}

export function useMuestraCategoria(categoria) {
  const [estado, setEstado] = useState({ items: [], total: 0, cargando: true });

  useEffect(() => {
    let vigente = true;
    setEstado((previo) => ({ ...previo, cargando: true }));
    buscarPublicacion(
      { opcion: categoria ? "categoria" : "todos", valor: categoria },
      { limite: 5, pagina: 1 },
    )
      .then((datos) => {
        if (!vigente) return;
        setEstado({ items: datos.items, total: datos.total, cargando: false });
      })
      .catch(() => {
        if (!vigente) return;
        setEstado({ items: [], total: 0, cargando: false });
      });
    return () => {
      vigente = false;
    };
  }, [categoria]);

  return estado;
}
