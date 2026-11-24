import { useId, useRef } from "react";
import { IconoAlerta, IconoCheck } from "./Iconos";

// Mensaje que se despliega y se pliega con suavidad. Conserva el último texto mientras se cierra.
export function MensajeColapsable({ abierto, tono = "error", bloque = false, children, ...props }) {
  const ultimo = useRef(null);
  if (abierto) ultimo.current = children;
  return (
    <div className="lg-msg" data-abierto={abierto} aria-live="polite" {...props}>
      <div className="lg-msg__recorte">
        <p className={`lg-msg__texto lg-msg__texto--${tono}${bloque ? " lg-msg__texto--bloque" : ""}`} aria-hidden={!abierto}>
          <IconoAlerta width="16" height="16" />
          <span>{ultimo.current}</span>
        </p>
      </div>
    </div>
  );
}

// Campo con etiqueta flotante, icono, estado de error/válido y espacio para un adorno a la derecha.
export function CampoTexto({ etiqueta, icono: Icono, error = "", valido = false, adorno, className = "", style, ...entrada }) {
  const id = useId();
  const idError = `${id}-error`;
  const clases = ["lg-campo", error && "lg-campo--error", valido && "lg-campo--valido", !Icono && "lg-campo--sin-icono", className].filter(Boolean).join(" ");

  return (
    <div className={clases} style={style}>
      <div className="lg-campo__caja">
        {Icono && <Icono className="lg-campo__icono" />}
        <input
          id={id}
          className="lg-campo__input"
          placeholder=" "
          aria-invalid={!!error}
          aria-describedby={error ? idError : undefined}
          {...entrada}
        />
        <label htmlFor={id} className="lg-campo__etiqueta">
          {etiqueta}
        </label>
        <span className="lg-campo__fin">
          {adorno ?? <IconoCheck className="lg-campo__ok" width="18" height="18" dibujar />}
        </span>
      </div>
      <MensajeColapsable abierto={!!error} id={idError}>
        {error}
      </MensajeColapsable>
    </div>
  );
}
