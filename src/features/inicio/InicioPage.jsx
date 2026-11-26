import { useState } from "react";
import { MarcoUso } from "../institucional/MarcoUso";
import { ProcesoPasos } from "../institucional/ProcesoPasos";
import { Metodologia } from "../institucional/Metodologia";
import { EntidadesObligadas } from "../institucional/EntidadesObligadas";
import { ResumenLista } from "../precios/ResumenLista";
import { useCategoriasPublicacion, useMuestraCategoria } from "../../hooks/useCatalogoPublico";
import { useResumenPublicacion } from "../../hooks/useResumenPublicacion";
import { consultaAParams } from "../../servicios/catalogo";
import { ConsultaRapida } from "./ConsultaRapida";
import { HeroBanner } from "./HeroBanner";
import { TableroPrecios } from "./TableroPrecios";

export function InicioPage() {
  const publicacion = useResumenPublicacion();
  const { categorias } = useCategoriasPublicacion();
  const [categoria, setCategoria] = useState("");
  const muestra = useMuestraCategoria(categoria);
  const destinoLista = categoria
    ? `/lista?${consultaAParams({ opcion: "categoria", valor: categoria }).toString()}`
    : "/lista";

  return (
    <>
      <HeroBanner />
      <ConsultaRapida categorias={categorias} />
      <TableroPrecios resumen={publicacion} />
      <ResumenLista
        items={muestra.items}
        indicadores={publicacion.indicadores}
        categorias={categorias}
        categoria={categoria}
        total={muestra.total}
        cargando={muestra.cargando}
        onCategoria={setCategoria}
        destinoLista={destinoLista}
      />
      <MarcoUso />
      <ProcesoPasos />
      <Metodologia />
      <EntidadesObligadas />
    </>
  );
}
