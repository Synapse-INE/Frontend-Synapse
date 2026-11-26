import { useId, useRef, useState } from "react";

function formatearBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function IconoPdf() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M14 3v6h6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function AdjuntosPdf({
  archivos = [],
  onChange,
  multiple = true,
  className = "",
  idExterno,
  alSubir,
  mostrarLista = true,
}) {
  const generado = useId();
  const id = idExterno || generado;
  const inputRef = useRef(null);
  const [arrastra, setArrastra] = useState(false);

  function agregar(lista) {
    const filtrados = lista.filter((archivo) => archivo.name.toLowerCase().endsWith(".pdf"));
    if (filtrados.length === 0) return;
    if (multiple) {
      const mapa = new Map(archivos.map((archivo) => [archivo.name + archivo.size, archivo]));
      for (const archivo of filtrados) mapa.set(archivo.name + archivo.size, archivo);
      onChange([...mapa.values()]);
    } else {
      onChange([filtrados[0]]);
    }
  }

  function quitar(indice) {
    onChange(archivos.filter((_, posicion) => posicion !== indice));
  }

  function manejarArchivos(evento) {
    agregar(Array.from(evento.target.files || []));
    evento.target.value = "";
    alSubir?.();
  }

  function manejarSoltar(evento) {
    evento.preventDefault();
    setArrastra(false);
    agregar(Array.from(evento.dataTransfer.files || []));
  }

  return (
    <div className={`sol-adj ${className}`.trim()}>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="application/pdf,.pdf"
        multiple={multiple}
        className="sol-adj__input"
        onChange={manejarArchivos}
      />
      <label
        htmlFor={id}
        className={arrastra ? "zona-adj zona-adj--activa" : "zona-adj"}
        onDragEnter={(evento) => {
          evento.preventDefault();
          setArrastra(true);
        }}
        onDragLeave={(evento) => {
          if (!evento.currentTarget.contains(evento.relatedTarget)) setArrastra(false);
        }}
        onDragOver={(evento) => evento.preventDefault()}
        onDrop={manejarSoltar}
      >
        <IconoPdf />
        <p>
          Arrastra PDF aquí o <b>elige archivos</b>
        </p>
        <small>PDF hasta 10 MB {multiple ? "· varios archivos" : ""}</small>
      </label>
      {mostrarLista && archivos.length > 0 ? (
        <ul className="archivos">
          {archivos.map((archivo, indice) => (
            <li key={`${archivo.name}-${archivo.size}-${indice}`} className="archivo">
              <i className="archivo__tipo archivo__tipo--pdf">PDF</i>
              <span className="archivo__nombre">
                {archivo.nombreOriginal || archivo.name}
                <small>{formatearBytes(archivo.tamanoBytes ?? archivo.size)}</small>
              </span>
              <button type="button" onClick={() => quitar(indice)} aria-label="Quitar archivo">
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function ListaAdjuntosDescarga({ adjuntos, onDescargar, onQuitar, puedeQuitar = false }) {
  if (!adjuntos?.length) return <p className="detalle-sol__vacio">No hay PDF en esta solicitud.</p>;
  return (
    <ul className="archivos archivos--descarga">
      {adjuntos.map((archivo) => (
        <li key={archivo.id} className="archivo">
          <i className="archivo__tipo archivo__tipo--pdf">PDF</i>
          <button type="button" className="archivo__nombre archivo__nombre--enlace" onClick={() => onDescargar(archivo)}>
            {archivo.nombreOriginal}
          </button>
          {puedeQuitar ? (
            <button type="button" onClick={() => onQuitar(archivo.id)} aria-label="Quitar">
              ×
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}