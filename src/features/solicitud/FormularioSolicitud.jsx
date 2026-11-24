import { useState } from "react";
import { MODALIDADES } from "../../data/precios";
import { Boton } from "../../components/ui/Boton";

const INICIAL = {
  institucion: "",
  bien: "",
  modalidad: MODALIDADES[0],
};

export function FormularioSolicitud() {
  const [datos, setDatos] = useState(INICIAL);
  const [enviado, setEnviado] = useState(false);

  function cambiar(evento) {
    const { name, value } = evento.target;
    setDatos((prev) => ({ ...prev, [name]: value }));
  }

  function enviar(evento) {
    evento.preventDefault();
    setEnviado(true);
  }

  return (
    <form className="formulario" onSubmit={enviar}>
      <label>
        Institución
        <input
          type="text"
          name="institucion"
          value={datos.institucion}
          onChange={cambiar}
          placeholder="Ministerio, municipalidad o entidad"
          required
        />
      </label>
      <label>
        Bien o servicio
        <input
          type="text"
          name="bien"
          value={datos.bien}
          onChange={cambiar}
          placeholder="Ej. 500 laptops para escuelas"
          required
        />
      </label>
      <label>
        Modalidad
        <select name="modalidad" value={datos.modalidad} onChange={cambiar}>
          {MODALIDADES.map((opcion) => (
            <option key={opcion}>{opcion}</option>
          ))}
        </select>
      </label>
      <Boton type="submit" variante="naranja" bloque>
        Preparar solicitud
      </Boton>
      {enviado ? (
        <p className="formulario__ayuda">
          Datos capturados para {datos.institucion}. El envío formal sigue el oficio institucional y los reglamentos del
          INE.
        </p>
      ) : (
        <p className="formulario__ayuda">
          Maquetado de captura. El envío formal sigue el oficio institucional y los reglamentos del INE.
        </p>
      )}
    </form>
  );
}
