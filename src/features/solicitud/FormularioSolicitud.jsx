import { useRef, useState } from "react";
import { MODALIDADES } from "../../data/precios";
import { guardarSolicitud, leerSolicitudes, numeroSeguimiento } from "../../data/solicitudes";
import { Boton } from "../../components/ui/Boton";
import { Turnstile } from "./Turnstile";
import { MAX_ARCHIVOS, MAX_DESCRIPCION, TEXTO_TIPOS, validarArchivo } from "./solicitudApi";

const LINEA = { nombre: "", codigoSiges: "", unidadMedida: "Unidad", cantidad: "" };

function formatoTamano(bytes) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FormularioSolicitud({ institucionInicial = "", creadaPorId }) {
  const inputArchivo = useRef(null);
  const [datos, setDatos] = useState({
    institucion: institucionInicial,
    titulo: "",
    modalidad: MODALIDADES[0],
    descripcion: "",
  });
  const [productos, setProductos] = useState([{ ...LINEA }]);
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

  function cambiarProducto(indice, campo, valor) {
    setProductos((prev) => prev.map((item, i) => (i === indice ? { ...item, [campo]: valor } : item)));
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

  async function enviar(evento) {
    evento.preventDefault();
    setErrorGeneral("");
    const e = {};
    if (datos.institucion.trim().length < 2) e.institucion = "Indica el nombre de la institución.";
    if (datos.titulo.trim().length < 5) e.titulo = "Describe el pedido con al menos 5 caracteres.";
    if (datos.descripcion.trim().length < 20) e.descripcion = "Describe lo que necesitas con al menos 20 caracteres.";
    if (!productos.some((item) => item.nombre.trim().length >= 3)) e.productos = "Agrega al menos un producto con nombre.";
    setErrores(e);
    if (Object.keys(e).length) return;
    if (!token) {
      setErrorGeneral("Completa la verificación de seguridad antes de enviar.");
      return;
    }
    setEnviando(true);
    const lineas = productos
      .filter((item) => item.nombre.trim())
      .map((item, indice) => ({
        numero: indice + 1,
        nombre: item.nombre.trim(),
        codigoSiges: item.codigoSiges.trim() || null,
        unidadMedida: item.unidadMedida.trim() || null,
        cantidad: item.cantidad === "" ? null : Number(item.cantidad),
      }));
    const id = `sol-${Date.now()}`;
    const solicitud = {
      id,
      titulo: datos.titulo.trim(),
      institucionSolicitante: datos.institucion.trim(),
      descripcion: datos.descripcion.trim(),
      modalidad: datos.modalidad,
      estado: "recibida",
      creadaPorId,
      createdAt: new Date().toISOString(),
      numeroSeguimiento: numeroSeguimiento(leerSolicitudes().length + 1),
      productos: lineas,
      adjuntos: adjuntos.map((archivo) => ({
        nombreOriginal: archivo.name,
        mimeVerificado: archivo.type,
        tamanoBytes: archivo.size,
      })),
    };
    guardarSolicitud(solicitud);
    setSeguimiento(solicitud.numeroSeguimiento);
    setEnviando(false);
    setReiniciarTurnstile((n) => n + 1);
  }

  function nuevaSolicitud() {
    setDatos({ institucion: institucionInicial, titulo: "", modalidad: MODALIDADES[0], descripcion: "" });
    setProductos([{ ...LINEA }]);
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
        <p className="formulario__seguimiento" aria-label={`Número de seguimiento ${seguimiento}`}>{seguimiento}</p>
        <p className="formulario__ayuda">El personal del INE la revisará y se pondrá en contacto contigo.</p>
        <Boton variante="azul" bloque onClick={nuevaSolicitud}>Enviar otra solicitud</Boton>
      </div>
    );
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <label>
        Institución
        <input type="text" name="institucion" value={datos.institucion} onChange={cambiar} placeholder="Ministerio, municipalidad o entidad" autoComplete="organization" aria-invalid={!!errores.institucion} />
        {errores.institucion && <span role="alert" className="formulario__error">⚠ {errores.institucion}</span>}
      </label>
      <label>
        Título de la solicitud
        <input type="text" name="titulo" value={datos.titulo} onChange={cambiar} placeholder="Ej. 500 laptops para escuelas" aria-invalid={!!errores.titulo} />
        {errores.titulo && <span role="alert" className="formulario__error">⚠ {errores.titulo}</span>}
      </label>
      <label>
        Modalidad
        <select name="modalidad" value={datos.modalidad} onChange={cambiar}>
          {MODALIDADES.map((opcion) => <option key={opcion}>{opcion}</option>)}
        </select>
      </label>
      <fieldset className="formulario__productos">
        <legend>Productos</legend>
        {productos.map((item, indice) => (
          <div className="formulario__producto" key={indice}>
            <label>
              Nombre
              <input value={item.nombre} onChange={(evento) => cambiarProducto(indice, "nombre", evento.target.value)} placeholder="Bien o servicio" />
            </label>
            <label>
              Código SIGES
              <input value={item.codigoSiges} onChange={(evento) => cambiarProducto(indice, "codigoSiges", evento.target.value)} placeholder="Opcional" />
            </label>
            <label>
              Unidad
              <input value={item.unidadMedida} onChange={(evento) => cambiarProducto(indice, "unidadMedida", evento.target.value)} />
            </label>
            <label>
              Cantidad
              <input type="number" min="0" step="0.001" value={item.cantidad} onChange={(evento) => cambiarProducto(indice, "cantidad", evento.target.value)} />
            </label>
            {productos.length > 1 ? (
              <button type="button" className="btn btn--linea btn--chico" onClick={() => setProductos((prev) => prev.filter((_, i) => i !== indice))}>Quitar</button>
            ) : null}
          </div>
        ))}
        <button type="button" className="btn btn--linea btn--chico" onClick={() => setProductos((prev) => [...prev, { ...LINEA }])}>Agregar producto</button>
        {errores.productos && <span role="alert" className="formulario__error">⚠ {errores.productos}</span>}
      </fieldset>
      <label>
        Descripción de lo que necesitas
        <textarea name="descripcion" rows={5} maxLength={MAX_DESCRIPCION} value={datos.descripcion} onChange={cambiar} placeholder="Incluye características (memoria, capacidad, medidas, etc.)" aria-invalid={!!errores.descripcion} />
        <span className="formulario__contador" aria-live="polite">{datos.descripcion.length}/{MAX_DESCRIPCION}</span>
        {errores.descripcion && <span role="alert" className="formulario__error">⚠ {errores.descripcion}</span>}
      </label>
      <div>
        <span className="formulario__titulo-campo">Archivos adjuntos (opcional)</span>
        <div
          className={`formulario__zona${arrastrando ? " formulario__zona--activa" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={(evento) => { evento.preventDefault(); setArrastrando(false); if (evento.dataTransfer.files.length) agregarArchivos(evento.dataTransfer.files); }}
        >
          <p>Arrastra tus archivos aquí o</p>
          <Boton variante="azul" onClick={() => inputArchivo.current?.click()}>Seleccionar archivos</Boton>
          <input ref={inputArchivo} type="file" multiple hidden accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg" onChange={(e) => { if (e.target.files) agregarArchivos(e.target.files); e.target.value = ""; }} />
          <p className="formulario__ayuda">{TEXTO_TIPOS}. Máximo {MAX_ARCHIVOS} archivos de 10 MB cada uno.</p>
        </div>
        {errorArchivos && <p role="alert" className="formulario__error">⚠ {errorArchivos}</p>}
        {adjuntos.length > 0 && (
          <ul className="formulario__archivos">
            {adjuntos.map((archivo, i) => (
              <li key={`${archivo.name}-${i}`}>
                <span>{archivo.name} <small>({formatoTamano(archivo.size)})</small></span>
                <button type="button" onClick={() => quitarArchivo(i)} aria-label={`Quitar ${archivo.name}`}>Quitar</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Turnstile onToken={setToken} reiniciar={reiniciarTurnstile} />
      {errorGeneral && <p role="alert" className="formulario__error formulario__error--general">⚠ {errorGeneral}</p>}
      <Boton type="submit" variante="naranja" bloque disabled={enviando}>{enviando ? "Enviando…" : "Enviar solicitud"}</Boton>
      <p className="formulario__ayuda">El envío formal sigue el oficio institucional y los reglamentos del INE.</p>
    </form>
  );
}
