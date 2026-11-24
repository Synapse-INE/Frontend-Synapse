import { MarcoUso } from "../institucional/MarcoUso";
import { ProcesoPasos } from "../institucional/ProcesoPasos";
import { Metodologia } from "../institucional/Metodologia";
import { EntidadesObligadas } from "../institucional/EntidadesObligadas";
import { ResumenLista } from "../precios/ResumenLista";
import { usePublicacion } from "../../hooks/usePublicacion";
import { ConsultaRapida } from "./ConsultaRapida";
import { HeroBanner } from "./HeroBanner";
import { TableroPrecios } from "./TableroPrecios";

export function InicioPage() {
  const publicacion = usePublicacion({ opcion: "todos", valor: "" });

  return (
    <>
      <HeroBanner />
      <ConsultaRapida />
      <TableroPrecios estadisticas={publicacion.estadisticas} />
      <ResumenLista items={publicacion.items} indicadores={publicacion.estadisticas.indicadores} />
      <MarcoUso />
      <ProcesoPasos />
      <Metodologia />
      <EntidadesObligadas />
    </>
  );
}
