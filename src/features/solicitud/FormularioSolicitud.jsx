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
  modalidad: "",
  descripcion: "",
};

const EJEMPLOS = ["500 laptops", "Acetaminofén 500 mg", "200 monitores de 24 pulgadas"];

// Trazos de los íconos (viewBox 24x24). Se dibujan con Icono.
const ICONOS = {
  edificio: "M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M14 10h5a1 1 0 0 1 1 1v10M8 8h2M8 12h2M8 16h2M3 21h18",
  lista: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
  caja: "M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8",
  nube: "M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 9.5a4 4 0 0 1-.5 8M12 12v8M9 15l3-3 3 3",
  flecha: "M5 12h14M13 6l6 6-6 6",
  candado: "M7 11h10a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2zM8 11V8a4 4 0 0 1 8 0v3",
  check: "M5 12.5l4.5 4.5L19 7.5",
  x: "M6 6l12 12M18 6L6 18",
  copiar: "M11 9h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM5 15V6a2 2 0 0 1 2-2h9",
};

function Icono({ nombre, tamano = 20, grosor = 1.8, className }) {
  return (
    <svg
      className={className}
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONOS[nombre]} />
    </svg>
  );
}

function formatoTamano(bytes) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Etiqueta de color para la tarjeta de cada archivo.
function tipoDeArchivo(nombre) {
  const ext = nombre.split(".").pop().toLowerCase();
  if (ext === "pdf") return { texto: "PDF", clase: "pdf" };
  if (ext === "doc" || ext === "docx") return { texto: "DOC", clase: "doc" };
  if (ext === "xls" || ext === "xlsx") return { texto: "XLS", clase: "xls" };
  return { texto: "IMG", clase: "img" };
}

function validar(datos) {
  const e = {};
  if (datos.institucion.trim().length < 2) e.institucion = "Indica el nombre de la institución.";
  if (!datos.modalidad) e.modalidad = "Elige una modalidad.";
  if (datos.bien.trim().length < 5) e.bien = "Describe el bien o servicio con al menos 5 caracteres.";
  if (datos.descripcion.trim().length < 20) e.descripcion = "Describe lo que necesitas con al menos 20 caracteres.";
  return e;
}

// Ocupa las tres zonas de la tarjeta de SolicitudPage: info (izquierda arriba),
// adjuntos (izquierda abajo) y formulario (derecha). "intro" es el título y el texto.
export function FormularioSolicitud({ intro }) {
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
  const [enviada, setEnviada] = useState(false);
  const [seguimiento, setSeguimiento] = useState(null);
  const [copiado, setCopiado] = useState(false);

  // Cada requisito se marca solo cuando el campo correspondiente está listo.
  const requisitos = [
    { texto: "Datos de la entidad requirente", ok: datos.institucion.trim().length >= 2 },
    {
      texto: "Descripción técnica del bien o servicio",
      ok: datos.bien.trim().length >= 5 && datos.descripcion.trim().length >= 20,
    },
    { texto: "Cantidades y unidad de medida", ok: /\d/.test(`${datos.bien} ${datos.descripcion}`) },
    { texto: "Modalidad de compra prevista", ok: datos.modalidad !== "" },
  ];
  const listos = requisitos.filter((r) => r.ok).length;

  function cambiar(evento) {
    const { name, value } = evento.target;
    setDatos((prev) => ({ ...prev, [name]: value }));
    if (errores[name]) setErrores((prev) => ({ ...prev, [name]: undefined }));
  }

  function usarEjemplo(texto) {
    setDatos((prev) => ({ ...prev, bien: texto }));
    if (errores.bien) setErrores((prev) => ({ ...prev, bien: undefined }));
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
      // El número de seguimiento solo se muestra si el backend lo devuelve.
      setSeguimiento(respuesta?.numeroSeguimiento ?? null);
      setEnviada(true);
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

  async function copiarSeguimiento() {
    try {
      await navigator.clipboard.writeText(seguimiento);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* sin permiso de portapapeles: el número sigue visible para copiarlo a mano */
    }
  }

  function nuevaSolicitud() {
    setDatos(INICIAL);
    setAdjuntos([]);
    setErrores({});
    setErrorArchivos("");
    setErrorGeneral("");
    setToken(null);
    setReiniciarTurnstile((n) => n + 1);
    setSeguimiento(null);
    setEnviada(false);
  }

  if (enviada) {
    return (
      <div className="exito" role="status">
        <div className="exito__circulo">
          <Icono nombre="check" tamano={42} grosor={3} />
        </div>
        <h2>¡Solicitud recibida!</h2>
        <p>El personal del INE la revisará y se pondrá en contacto contigo.</p>

        {seguimiento && (
          <div className="exito__seguimiento">
            <div>
              <small>Número de seguimiento</small>
              <strong>{seguimiento}</strong>
            </div>
            <button type="button" onClick={copiarSeguimiento}>
              <Icono nombre="copiar" tamano={16} grosor={1.9} /> {copiado ? "¡Copiado!" : "Copiar"}
            </button>
          </div>
        )}

        <ol className="exito__pasos">
          <li className="hecho">
            <b>
              <Icono nombre="check" tamano={20} grosor={3} />
            </b>
            <strong>Recibida</strong>
            <span>Tu solicitud ya está en el sistema</span>
          </li>
          <li>
            <b>2</b>
            <strong>En revisión</strong>
            <span>El personal del INE analiza lo solicitado</span>
          </li>
          <li>
            <b>3</b>
            <strong>Respuesta</strong>
            <span>Te contactarán con el resultado</span>
          </li>
        </ol>

        <Boton variante="azul" onClick={nuevaSolicitud}>
          Enviar otra solicitud
        </Boton>
      </div>
    );
  }

  return (
    <>
      <div className="sol-info">
        {intro}
        <div className="panel-req">
          <div className="panel-req__cab">
            <strong>Tu solicitud debe incluir</strong>
            <span aria-live="polite">{listos} de 4 listos</span>
          </div>
          <div className="progreso" aria-hidden="true">
            <i style={{ width: `${(listos / requisitos.length) * 100}%` }} />
          </div>
          <ul className="checks">
            {requisitos.map((r) => (
              <li key={r.texto} className={r.ok ? "ok" : "pend"}>
                {r.texto}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <form className="formulario sol-form" onSubmit={enviar} noValidate>
        <div className="paso">
          <b>1</b>Datos de la institución
        </div>

        <label className="sol-medio">
          Institución
          <div className="campo">
            <Icono nombre="edificio" />
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
          </div>
          {errores.institucion && (
            <span id="error-institucion" role="alert" className="formulario__error">
              ⚠ {errores.institucion}
            </span>
          )}
        </label>

        <label className="sol-medio">
          Modalidad
          <div className="campo">
            <Icono nombre="lista" />
            <select
              name="modalidad"
              value={datos.modalidad}
              onChange={cambiar}
              aria-invalid={!!errores.modalidad}
              aria-describedby={errores.modalidad ? "error-modalidad" : undefined}
            >
              <option value="" disabled>
                Selecciona una modalidad
              </option>
              {MODALIDADES.map((opcion) => (
                <option key={opcion}>{opcion}</option>
              ))}
            </select>
          </div>
          {errores.modalidad && (
            <span id="error-modalidad" role="alert" className="formulario__error">
              ⚠ {errores.modalidad}
            </span>
          )}
        </label>

        <div className="paso paso--sep">
          <b>2</b>¿Qué necesitas?
        </div>

        <label>
          Bien o servicio
          <div className="campo">
            <Icono nombre="caja" />
            <input
              type="text"
              name="bien"
              value={datos.bien}
              onChange={cambiar}
              placeholder="Ej. 500 laptops para escuelas"
              aria-invalid={!!errores.bien}
              aria-describedby={errores.bien ? "error-bien" : undefined}
            />
          </div>
          {errores.bien && (
            <span id="error-bien" role="alert" className="formulario__error">
              ⚠ {errores.bien}
            </span>
          )}
        </label>

        <div className="ejemplos">
          <em>Ejemplos:</em>
          {EJEMPLOS.map((texto) => (
            <button type="button" key={texto} className="ejemplo" onClick={() => usarEjemplo(texto)}>
              {texto}
            </button>
          ))}
        </div>

        <label>
          Descripción de lo que necesitas
          <textarea
            name="descripcion"
            rows={4}
            maxLength={MAX_DESCRIPCION}
            value={datos.descripcion}
            onChange={cambiar}
            placeholder="Incluye cantidad y características (memoria, capacidad, medidas, etc.)"
            aria-invalid={!!errores.descripcion}
            aria-describedby={errores.descripcion ? "error-descripcion" : undefined}
          />
          <span className="formulario__pie-campo">
            <span>Mientras más detalle, más preciso el precio.</span>
            <span aria-live="polite">
              {datos.descripcion.length}/{MAX_DESCRIPCION}
            </span>
          </span>
          {errores.descripcion && (
            <span id="error-descripcion" role="alert" className="formulario__error">
              ⚠ {errores.descripcion}
            </span>
          )}
        </label>

        <div className="paso paso--sep">
          <b>3</b>Documentos de respaldo <span className="formulario__opcional">(opcional)</span>
        </div>

        <div className="sol-adj">
          <div
            className={`zona-adj${arrastrando ? " zona-adj--activa" : ""}`}
            role="button"
            tabIndex={0}
            aria-label="Seleccionar archivos o arrastrarlos aquí"
            onClick={() => inputArchivo.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputArchivo.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setArrastrando(true);
            }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={alSoltar}
          >
            <Icono nombre="nube" tamano={38} grosor={1.6} />
            <p>
              <b>Selecciona</b> o arrastra tus archivos aquí
            </p>
            <small>
              {TEXTO_TIPOS} · máx. {MAX_ARCHIVOS} archivos de 10 MB
            </small>
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
          </div>
          {errorArchivos && (
            <p role="alert" className="formulario__error">
              ⚠ {errorArchivos}
            </p>
          )}
          {adjuntos.length > 0 && (
            <ul className="archivos">
              {adjuntos.map((archivo, i) => {
                const tipo = tipoDeArchivo(archivo.name);
                return (
                  <li key={`${archivo.name}-${i}`} className="archivo">
                    <i className={`archivo__tipo archivo__tipo--${tipo.clase}`}>{tipo.texto}</i>
                    <span className="archivo__nombre">
                      {archivo.name}
                      <small>{formatoTamano(archivo.size)}</small>
                    </span>
                    <button type="button" onClick={() => quitarArchivo(i)} aria-label={`Quitar ${archivo.name}`}>
                      <Icono nombre="x" tamano={14} grosor={2.2} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {errorGeneral && (
          <p role="alert" className="formulario__error formulario__error--general">
            ⚠ {errorGeneral}
          </p>
        )}

        <div className="sol-pie">
          <div className="sol-turnstile">
            <Turnstile onToken={setToken} reiniciar={reiniciarTurnstile} />
          </div>
          <div className="sol-acciones">
            <Boton type="submit" variante="naranja" className="btn-enviar" disabled={enviando}>
              {enviando ? (
                "Enviando…"
              ) : (
                <>
                  Enviar solicitud <Icono nombre="flecha" tamano={18} grosor={2.2} />
                </>
              )}
            </Boton>
          </div>
        </div>
        <p className="formulario__confianza">
          <Icono nombre="candado" tamano={14} grosor={1.9} /> Tus datos se usan solo para esta solicitud. El envío
          formal sigue el oficio institucional del INE.
        </p>
      </form>
    </>
  );
}
