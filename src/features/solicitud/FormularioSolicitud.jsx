import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Boton } from "../../components/ui/Boton";
import { useSesion } from "../../sesion/Sesion";
import { ApiError } from "../../servicios/api";
import { AdjuntosPdf } from "./AdjuntosPdf";
import { crearYEnviarSolicitud } from "./solicitudApi";
import "./solicitudForm.css";
import { useTourSolicitud } from "../../tours/tourSolicitud";

const MODALIDADES = [
  { valor: "CONTRATO_ABIERTO", etiqueta: "Contrato abierto" },
  { valor: "SUBASTA_ELECTRONICA_INVERSA", etiqueta: "Subasta electrónica inversa" },
  { valor: "BIENES_SUMINISTROS_IMPORTADOS", etiqueta: "Bienes y suministros importados" },
];

const EJEMPLOS_TITULO = [
  "Equipamiento de cómputo para aulas",
  "Insumos de oficina — año fiscal",
  "Mobiliario escolar",
];

const UNIDADES_COMUNES = [
  "unidad",
  "caja",
  "paquete",
  "juego",
  "litro",
  "kilogramo",
  "metro",
  "servicio",
];

const PRODUCTO_VACIO = { nombre: "", especificacionesTecnicas: "", unidadMedida: "unidad", cantidad: "1" };

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

function inicial(perfil = {}) {
  return {
    titulo: "",
    descripcion: "",
    modalidad: "CONTRATO_ABIERTO",
    unidadEjecutora: perfil.institucion || "",
    fechaFormulario: hoy(),
    enlaceNombre: perfil.nombre || "",
    enlaceCargo: "",
    autoridadNombre: "",
    autoridadCargo: "",
    productos: [{ ...PRODUCTO_VACIO }],
  };
}

export function FormularioSolicitud({ intro }) {
  const { sesion } = useSesion();
  const [datos, setDatos] = useState(() => inicial(sesion || {}));
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [creada, setCreada] = useState(null);
  const [archivos, setArchivos] = useState([]);
  useTourSolicitud();

  useEffect(() => {
    if (!sesion) return;
    setDatos((previo) => ({
      ...previo,
      enlaceNombre: previo.enlaceNombre || sesion.nombre || "",
      unidadEjecutora: previo.unidadEjecutora || sesion.institucion || "",
    }));
  }, [sesion]);

  function cambiar(evento) {
    const { name, value } = evento.target;
    setDatos((previo) => ({ ...previo, [name]: value }));
  }

  function cambiarProducto(indice, campo, valor) {
    setDatos((previo) => ({
      ...previo,
      productos: previo.productos.map((item, posicion) => (
        posicion === indice ? { ...item, [campo]: valor } : item
      )),
    }));
  }

  function completarEnlace() {
    if (!sesion) return;
    setDatos((previo) => ({
      ...previo,
      enlaceNombre: sesion.nombre || previo.enlaceNombre,
      unidadEjecutora: previo.unidadEjecutora || sesion.institucion || "",
    }));
  }

  function duplicarProducto(indice) {
    const base = datos.productos[indice];
    if (!base) return;
    setDatos((previo) => ({
      ...previo,
      productos: [
        ...previo.productos,
        {
          nombre: base.nombre,
          especificacionesTecnicas: base.especificacionesTecnicas,
          unidadMedida: base.unidadMedida,
          cantidad: base.cantidad,
        },
      ],
    }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    setError("");
    const pesado = archivos.find((archivo) => archivo.size > 10 * 1024 * 1024 || !archivo.name.toLowerCase().endsWith(".pdf"));
    if (pesado) {
      setError("Cada anexo tiene que ser un PDF de hasta 10 MB.");
      return;
    }
    setEnviando(true);
    try {
      setCreada(await crearYEnviarSolicitud(datos, archivos));
    } catch (fallo) {
      const detalle = fallo instanceof ApiError
        ? fallo.errors?.[0]?.message || fallo.detail
        : fallo?.message || "No se pudo enviar la solicitud.";
      setError(detalle);
    } finally {
      setEnviando(false);
    }
  }

  if (creada) {
    return (
      <>
        {intro}
        <p role="status">La solicitud {creada.codigo} quedó recibida. El INE la verá en su bandeja.</p>
        <Link className="btn btn--naranja" to="/cuenta">Ver mis solicitudes</Link>
      </>
    );
  }

  return (
    <>
      {intro}
      <form className="sol-form" onSubmit={enviar}>
        <section className="sol-bloque" id="sol-bloque-expediente">
          <div className="paso"><b>1</b>Datos del expediente</div>
          {sesion ? (
            <div className="sol-acciones-rapidas">
              <button type="button" className="btn btn--linea btn--chico" onClick={completarEnlace}>
                Usar mi nombre e institución en el enlace
              </button>
            </div>
          ) : null}

          <div className="sol-mosaico">
            <label className="sol-campo sol-campo--12">
              Título
              <input name="titulo" value={datos.titulo} onChange={cambiar} minLength={3} maxLength={200} required placeholder="Ej. 500 laptops para escuelas" />
              <div className="sol-ayudas" aria-label="Ejemplos de título">
                <em>Ejemplos:</em>
                {EJEMPLOS_TITULO.map((texto) => (
                  <button key={texto} type="button" className="ejemplo" onClick={() => setDatos((previo) => ({ ...previo, titulo: texto }))}>
                    {texto}
                  </button>
                ))}
              </div>
            </label>

            <label className="sol-campo sol-campo--12 sol-campo--desc">
              Descripción
              <textarea name="descripcion" rows={3} maxLength={10000} value={datos.descripcion} onChange={cambiar} required placeholder="Qué se necesita y con qué características" />
            </label>

            <label className="sol-campo sol-campo--4">
              Modalidad
              <select name="modalidad" value={datos.modalidad} onChange={cambiar}>
                {MODALIDADES.map((item) => <option key={item.valor} value={item.valor}>{item.etiqueta}</option>)}
              </select>
            </label>
            <label className="sol-campo sol-campo--4">
              Unidad ejecutora
              <input name="unidadEjecutora" value={datos.unidadEjecutora} onChange={cambiar} maxLength={200} required list="sol-unidades-inst" placeholder="Dependencia que ejecuta la compra" />
            </label>
            <label className="sol-campo sol-campo--4">
              Fecha del formulario
              <input name="fechaFormulario" type="date" value={datos.fechaFormulario} onChange={cambiar} required />
            </label>

            <label className="sol-campo sol-campo--6">
              Enlace
              <input name="enlaceNombre" value={datos.enlaceNombre} onChange={cambiar} maxLength={200} required placeholder="Nombre de quien da seguimiento" />
            </label>
            <label className="sol-campo sol-campo--6">
              Cargo del enlace
              <input name="enlaceCargo" value={datos.enlaceCargo} onChange={cambiar} maxLength={150} required placeholder="Ej. Jefe de compras" />
            </label>
            <label className="sol-campo sol-campo--6">
              Autoridad
              <input name="autoridadNombre" value={datos.autoridadNombre} onChange={cambiar} maxLength={200} required placeholder="Máxima autoridad firmante" />
            </label>
            <label className="sol-campo sol-campo--6">
              Cargo de la autoridad
              <input name="autoridadCargo" value={datos.autoridadCargo} onChange={cambiar} maxLength={150} required placeholder="Ej. Director general" />
            </label>
          </div>
        </section>

        <datalist id="sol-unidades-inst">
          {sesion?.institucion ? <option value={sesion.institucion} /> : null}
        </datalist>
        <datalist id="sol-unidades-medida">
          {UNIDADES_COMUNES.map((unidad) => <option key={unidad} value={unidad} />)}
        </datalist>

        <section className="sol-bloque" id="sol-bloque-productos">
          <div className="paso paso--sep"><b>2</b>Productos</div>
          {datos.productos.map((producto, indice) => (
            <fieldset key={indice} className="sol-producto">
              <legend>Producto {indice + 1}</legend>
              <div className="sol-producto__rejilla">
                <label className="sol-campo sol-campo--12">
                  Nombre
                  <input value={producto.nombre} onChange={(evento) => cambiarProducto(indice, "nombre", evento.target.value)} maxLength={240} required placeholder="Nombre del bien o servicio" />
                </label>
                <label className="sol-campo sol-campo--12">
                  Especificaciones
                  <textarea rows={2} value={producto.especificacionesTecnicas} onChange={(evento) => cambiarProducto(indice, "especificacionesTecnicas", evento.target.value)} required placeholder="Marca, medidas, normas técnicas…" />
                </label>
                <label className="sol-campo sol-campo--6">
                  Unidad
                  <input value={producto.unidadMedida} onChange={(evento) => cambiarProducto(indice, "unidadMedida", evento.target.value)} maxLength={80} required list="sol-unidades-medida" />
                </label>
                <label className="sol-campo sol-campo--6">
                  Cantidad
                  <input value={producto.cantidad} onChange={(evento) => cambiarProducto(indice, "cantidad", evento.target.value)} inputMode="decimal" required />
                </label>
              </div>
              <div className="sol-acciones-rapidas">
                {datos.productos.length > 1 ? (
                  <button type="button" className="btn btn--linea btn--chico" onClick={() => setDatos((previo) => ({
                    ...previo,
                    productos: previo.productos.filter((_, posicion) => posicion !== indice),
                  }))}
                  >
                    Quitar producto
                  </button>
                ) : null}
                <button type="button" className="btn btn--linea btn--chico" onClick={() => duplicarProducto(indice)}>
                  Duplicar este producto
                </button>
              </div>
            </fieldset>
          ))}
          <button type="button" className="btn btn--linea" onClick={() => setDatos((previo) => ({
            ...previo,
            productos: [...previo.productos, { ...PRODUCTO_VACIO }],
          }))}
          >
            Agregar producto
          </button>
        </section>

        <section className="sol-bloque sol-bloque--pie" id="sol-bloque-anexos">
          <div className="paso paso--sep"><b>3</b>Anexos <span className="formulario__opcional">(opcional)</span></div>
          <AdjuntosPdf archivos={archivos} onChange={setArchivos} multiple />
          <p>Opcional. Al enviar, estos PDF quedan fijos y ya no se pueden quitar.</p>

          {error ? <p role="alert" className="formulario__error formulario__error--general">⚠ {error}</p> : null}
          <div className="sol-pie">
            <div className="sol-acciones">
              <Boton id="sol-enviar" type="submit" variante="naranja" className="btn-enviar" disabled={enviando}>
                {enviando ? "Enviando…" : "Enviar solicitud"}
              </Boton>
            </div>
          </div>
          <p className="formulario__confianza">
            La solicitud queda ligada a la institución de esta cuenta. El PDF se adjunta antes de enviarla.
          </p>
        </section>
      </form>
    </>
  );
}