import { MarcoUso } from "../institucional/MarcoUso";
import { ProcesoPasos } from "../institucional/ProcesoPasos";
import { Metodologia } from "../institucional/Metodologia";
import { EntidadesObligadas } from "../institucional/EntidadesObligadas";
import { ResumenLista } from "../precios/ResumenLista";
import { ConsultaRapida } from "./ConsultaRapida";
import { HeroBanner } from "./HeroBanner";
import { TableroPrecios } from "./TableroPrecios";

export function InicioPage() {
  return (
    <>
      <HeroBanner />
      <ConsultaRapida />
      <TableroPrecios />
      <ResumenLista />
      <MarcoUso />
      <ProcesoPasos />
      <Metodologia />
      <EntidadesObligadas />
    </>
  );
}
