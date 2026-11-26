import { useState } from "react";
import { IconoCheck } from "./Iconos";

// Botón principal con ripple, estado de carga y estado de éxito.
// estado: "reposo" | "cargando" | "exito"
export function BotonPrimario({ estado = "reposo", children, textoCarga = "Ingresando", textoExito = "Listo", className = "", ...props }) {
  const [ondas, setOndas] = useState([]);

  function crearOnda(evento) {
    if (estado !== "reposo") return;
    const caja = evento.currentTarget.getBoundingClientRect();
    setOndas((previas) => [...previas, { id: evento.timeStamp, x: evento.clientX - caja.left, y: evento.clientY - caja.top }]);
  }

  return (
    <button
      type="submit"
      className={`lg-boton lg-boton--${estado} ${className}`.trim()}
      aria-busy={estado === "cargando"}
      disabled={estado !== "reposo"}
      onPointerDown={crearOnda}
      {...props}
    >
      <span className="lg-boton__ondas" aria-hidden="true">
        {ondas.map((onda) => (
          <span
            key={onda.id}
            className="lg-onda"
            style={{ left: onda.x, top: onda.y }}
            onAnimationEnd={() => setOndas((previas) => previas.filter((o) => o.id !== onda.id))}
          />
        ))}
      </span>
      <span className="lg-boton__capa lg-boton__capa--reposo">{children}</span>
      <span className="lg-boton__capa lg-boton__capa--cargando" aria-hidden={estado !== "cargando"}>
        <span className="lg-giro" aria-hidden="true" />
        {textoCarga}
      </span>
      <span className="lg-boton__capa lg-boton__capa--exito" aria-hidden={estado !== "exito"}>
        <IconoCheck width="20" height="20" dibujar />
        {textoExito}
      </span>
    </button>
  );
}
