import { useRef, useState } from "react";
import { MODALIDADES } from "../../data/precios";
import { Boton } from "../../components/ui/Boton";
import { Turnstile } from "./Turnstile";
import {
  ApiError,
  MAX_ARCHIVOS,
  MAX_DESCRIPCION,
  TEXTO_TIPOS,
  enviarSolicitud,
  mensajeDeError,
  validarArchivo,
} from "./solicitudApi";

const INICIAL = {
  institucion: "",
  bien: "",
  modalidad: MODALIDADES[0],
  descripcion: "",
};

function formatoTamano(bytes) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validar(datos) {
  const e = {};
  if (datos.institucion.trim().length < 2) e.institucion = "Indica el nombre de la institución.";
  if (datos.bien.trim().length < 5) e.bien = "Describe el bien o servicio con al menos 5 caracteres.";
  if (datos.descripcion.trim().length < 20) e.descripcion = "Describe lo que necesitas con al menos 20 caracteres.";
  return e;
}

export function FormularioSolicitud() {
  const inputArchivo = useRef(null);
  const [datos, setDatos] = useState(INICIAL);
  const [adjuntos, setAdjuntos] = useState([]);
  const [errores, setErrores] = useState({});
  const [errorArchivos, setErrorArchivos] = useState("");
  const [errorGeneral, setErrorGeneral] = useState("");
  const [token, setToken] = useState(null);
  const [reiniciarTurnstile, setReiniciarTurnstile] = useState(0);
  const [arrastrando, setArrastrando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [seguimiento, setSeguimiento] = useState(null);

  function cambiar(evento) {
    const { name, value } = evento.target;
    setDatos((prev) => ({ ...prev, [name]: value }));
    if (errores[name]) setErrores((prev) => ({ ...prev, [name]: undefined }));
  }

  function agregarArchivos(lista) {
    const problemas = [];
    const validos = [];
    Array.from(lista).forEach((archivo) => {
      const motivo = validarArchivo(archivo);
      if (motivo) problemas.push(motivo);
      else validos.push(archivo);
    });

    const combinados = [...adjuntos, ...validos];
    if (combinados.length > MAX_ARCHIVOS) problemas.push(`Máximo ${MAX_ARCHIVOS} archivos por solicitud.`);

    setErrorArchivos(problemas.join(" "));
    setAdjuntos(combinados.slice(0, MAX_ARCHIVOS));
  }

  function quitarArchivo(indice) {
    setErrorArchivos("");
    setAdjuntos((prev) => prev.filter((_, i) => i !== indice));
  }

  function alSoltar(evento) {
    evento.preventDefault();
    setArrastrando(false);
    if (evento.dataTransfer.files.length) agregarArchivos(evento.dataTransfer.files);
  }

  async function enviar(evento) {
    evento.preventDefault();
    setErrorGeneral("");

    const e = validar(datos);
    setErrores(e);
    if (Object.keys(e).length) return;
    if (!token) {
      setErrorGeneral("Completa la verificación de seguridad antes de enviar.");
      return;
    }

    setEnviando(true);
    try {
      const respuesta = await enviarSolicitud({ ...datos, adjuntos, turnstileToken: token });
      setSeguimiento(respuesta.numeroSeguimiento);
    } catch (error) {
      if (error instanceof ApiError) {
        const delServidor = {};
        error.errors.forEach((c) => {
          delServidor[c.field === "titulo" ? "bien" : c.field] = c.message;
        });
        setErrores((prev) => ({ ...prev, ...delServidor }));
        setErrorGeneral(mensajeDeError(error));
      } else {
        setErrorGeneral("No pudimos conectarnos. Revisa tu internet e intenta de nuevo.");
      }
      // El token de Turnstile es de un solo uso: hay que pedir uno nuevo.
      setToken(null);
      setReiniciarTurnstile((n) => n + 1);
    } finally {
      setEnviando(false);
    }
  }

  function nuevaSolicitud() {
    setDatos(INICIAL);
    setAdjuntos([]);
    setErrores({});
    setErrorArchivos("");
    setErrorGeneral("");
    setToken(null);
    setSeguimiento(null);
  }

  if (seguimiento) {
    return (
      <div className="formulario formulario__confirmacion" role="status">
        <h3>✓ Solicitud recibida</h3>
        <p>Guarda tu número de seguimiento para consultar el estado:</p>
        <p className="formulario__seguimiento" aria-label={`Número de seguimiento ${seguimiento}`}>
          {seguimiento}
        </p>
        <p className="formulario__ayuda">El personal del INE la revisará y se pondrá en contacto contigo.</p>
        <Boton variante="azul" bloque onClick={nuevaSolicitud}>
          Enviar otra solicitud
        </Boton>
      </div>
    );
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <label>
        Institución
        <input
          type="text"
          name="institucion"
          value={datos.institucion}
          onChange={cambiar}
          placeholder="Ministerio, municipalidad o entidad"
          autoComplete="organization"
          aria-invalid={!!errores.institucion}
          aria-describedby={errores.institucion ? "error-institucion" : undefined}
        />
        {errores.institucion && (
          <span id="error-institucion" role="alert" className="formulario__error">
            ⚠ {errores.institucion}
          </span>
        )}
      </label>

      <label>
        Bien o servicio
        <input
          type="text"
          name="bien"
          value={datos.bien}
          onChange={cambiar}
          placeholder="Ej. 500 laptops para escuelas"
          aria-invalid={!!errores.bien}
          aria-describedby={errores.bien ? "error-bien" : undefined}
        />
        {errores.bien && (
          <span id="error-bien" role="alert" className="formulario__error">
            ⚠ {errores.bien}
          </span>
        )}
      </label>

      <label>
        Modalidad
        <select name="modalidad" value={datos.modalidad} onChange={cambiar}>
          {MODALIDADES.map((opcion) => (
            <option key={opcion}>{opcion}</option>
          ))}
        </select>
      </label>

      <label>
        Descripción de lo que necesitas
        <textarea
          name="descripcion"
          rows={5}
          maxLength={MAX_DESCRIPCION}
          value={datos.descripcion}
          onChange={cambiar}
          placeholder="Incluye cantidad y características (memoria, capacidad, medidas, etc.)"
          aria-invalid={!!errores.descripcion}
          aria-describedby={errores.descripcion ? "error-descripcion" : undefined}
        />
        <span className="formulario__contador" aria-live="polite">
          {datos.descripcion.length}/{MAX_DESCRIPCION}
        </span>
        {errores.descripcion && (
          <span id="error-descripcion" role="alert" className="formulario__error">
            ⚠ {errores.descripcion}
          </span>
        )}
      </label>

      <div>
        <span className="formulario__titulo-campo">Archivos adjuntos (opcional)</span>
        <div
          className={`formulario__zona${arrastrando ? " formulario__zona--activa" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={alSoltar}
        >
          <p>Arrastra tus archivos aquí o</p>
          <Boton variante="azul" onClick={() => inputArchivo.current?.click()}>
            Seleccionar archivos
          </Boton>
          <input
            ref={inputArchivo}
            type="file"
            multiple
            hidden
            accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
            onChange={(e) => {
              if (e.target.files) agregarArchivos(e.target.files);
              e.target.value = "";
            }}
          />
          <p className="formulario__ayuda">
            {TEXTO_TIPOS}. Máximo {MAX_ARCHIVOS} archivos de 10 MB cada uno.
          </p>
        </div>
        {errorArchivos && (
          <p role="alert" className="formulario__error">
            ⚠ {errorArchivos}
          </p>
        )}
        {adjuntos.length > 0 && (
          <ul className="formulario__archivos">
            {adjuntos.map((archivo, i) => (
              <li key={`${archivo.name}-${i}`}>
                <span>
                  {archivo.name} <small>({formatoTamano(archivo.size)})</small>
                </span>
                <button type="button" onClick={() => quitarArchivo(i)} aria-label={`Quitar ${archivo.name}`}>
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Turnstile onToken={setToken} reiniciar={reiniciarTurnstile} />

      {errorGeneral && (
        <p role="alert" className="formulario__error formulario__error--general">
          ⚠ {errorGeneral}
        </p>
      )}

      <Boton type="submit" variante="naranja" bloque disabled={enviando}>
        {enviando ? "Enviando…" : "Enviar solicitud"}
      </Boton>
      <p className="formulario__ayuda">
        El envío formal sigue el oficio institucional y los reglamentos del INE.
      </p>
    </form>
  );
}
