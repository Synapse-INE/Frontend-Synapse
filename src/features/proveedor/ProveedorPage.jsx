import { useEffect, useMemo, useRef, useState } from "react";
import { Contenedor } from "../../components/ui/Contenedor";
import { Etiqueta } from "../../components/ui/Etiqueta";
import { formatearFecha, formatearQuetzales } from "../../data/precios";
import {
  ATRIBUTOS,
  atributosVacios,
  estadoDe,
  etiquetaEstado,
  precioActual,
} from "../../data/ofertasProveedor";
import { ApiError } from "../../servicios/api";
import { useCategoriasPublicacion } from "../../hooks/useCatalogoPublico";
import { useSesion } from "../../sesion/Sesion";
import { SelectorCategoria } from "../precios/SelectorCategoria";
import { tituloCategoria } from "../precios/tituloCategoria";
import {
  actualizarProductoProveedor,
  confirmarPrecioProveedor,
  crearProductoProveedor,
  listarMisProductos,
} from "./proveedorApi";
import {
  LIMITES_PRODUCTO,
  PRESENTACIONES_SUGERIDAS,
  VACIO_PRODUCTO,
  armarCuerpoProducto,
  erroresDesdeApi,
  validarProductoProveedor,
} from "./productoProveedorForm";
import { runTourProveedor, useTourProveedor } from "./tourProveedor";

const CORTES = [
  { id: "todas", titulo: "Productos" },
  { id: "vigente", titulo: "Vigentes" },
  { id: "por_confirmar", titulo: "Por confirmar" },
  { id: "accion", titulo: "Requieren acción" },
];

const CICLO = [
  { n: "01", titulo: "Vigente", texto: "La vigencia del precio aún no se cumple." },
  { n: "02", titulo: "Por confirmar", texto: "La vigencia ya venció. Hay que confirmar o cambiar el monto." },
  { n: "03", titulo: "Confirmar", texto: "Una confirmación abre otra vigencia de 6 meses, con el mismo monto." },
];

const SIGNIFICADO = {
  vigente: "Este precio está dentro de su vigencia. El INE puede usarlo como fuente al armar un precio de referencia.",
  por_confirmar: "La vigencia ya venció. Confírmalo o cámbialo para abrir otros 6 meses.",
};

export function ProveedorPage() {
  const { sesion } = useSesion();
  const { categorias, cargando: cargandoCategorias } = useCategoriasPublicacion();
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [falloCarga, setFalloCarga] = useState("");
  const [corte, setCorte] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [presentacion, setPresentacion] = useState("");
  const [orden, setOrden] = useState({ campo: "nombre", direccion: "asc" });
  const [detalle, setDetalle] = useState(null);
  const [alta, setAlta] = useState(false);
  const [edicion, setEdicion] = useState(null);
  const [datos, setDatos] = useState(VACIO_PRODUCTO);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [marcado, setMarcado] = useState(null);
  useTourProveedor();

  useEffect(() => {
    let viva = true;
    setCargando(true);
    setFalloCarga("");
    listarMisProductos()
      .then((datos) => {
        if (!viva) return;
        setNombreEmpresa(datos.proveedor?.nombreComercial || "");
        setProductos(datos.productos || []);
      })
      .catch((fallo) => {
        if (!viva) return;
        setProductos([]);
        setFalloCarga(
          fallo instanceof ApiError
            ? fallo.detail || "No se pudo cargar el catálogo."
            : "No se pudo cargar el catálogo.",
        );
      })
      .finally(() => {
        if (viva) setCargando(false);
      });
    return () => {
      viva = false;
    };
  }, []);

  const resumen = useMemo(() => {
    const conteo = { todas: productos.length, vigente: 0, por_confirmar: 0, accion: 0 };
    for (const item of productos) {
      const estado = estadoDe(item);
      conteo[estado] += 1;
      if (estado !== "vigente") conteo.accion += 1;
    }
    return conteo;
  }, [productos]);

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    const lista = productos.filter((item) => {
      const estado = estadoDe(item);
      if (corte === "vigente" && estado !== "vigente") return false;
      if (corte === "por_confirmar" && estado !== "por_confirmar") return false;
      if (corte === "accion" && estado === "vigente") return false;
      if (presentacion && item.presentacion !== presentacion) return false;
      if (!texto) return true;
      return `${item.codigoProveedor} ${item.nombre} ${item.descripcion} ${item.categoriaOriginal}`.toLowerCase().includes(texto);
    });
    const factor = orden.direccion === "asc" ? 1 : -1;
    lista.sort((a, b) => {
      const va = valorOrden(a, orden.campo);
      const vb = valorOrden(b, orden.campo);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * factor;
      return String(va).localeCompare(String(vb), "es", { numeric: true }) * factor;
    });
    return lista;
  }, [productos, corte, busqueda, presentacion, orden]);

  function ordenar(campo) {
    setOrden((prev) =>
      prev.campo === campo
        ? { campo, direccion: prev.direccion === "asc" ? "desc" : "asc" }
        : { campo, direccion: "asc" }
    );
  }

  function cambiar(evento) {
    const { name, value } = evento.target;
    if (name.startsWith("atributo.")) {
      const clave = name.slice("atributo.".length);
      setDatos((prev) => ({ ...prev, atributos: { ...prev.atributos, [clave]: value } }));
      setErrores((prev) => ({ ...prev, [name]: "" }));
      return;
    }
    setDatos((prev) => ({ ...prev, [name]: value }));
    setErrores((prev) => ({ ...prev, [name]: "" }));
  }

  function cerrarForma() {
    setAlta(false);
    setEdicion(null);
    setDatos(VACIO_PRODUCTO);
    setErrores({});
  }

  function marcar(id) {
    setMarcado(id);
    window.setTimeout(() => setMarcado((actual) => (actual === id ? null : actual)), 900);
  }

  function abrirNuevo() {
    setEdicion(null);
    setDatos(VACIO_PRODUCTO);
    setAlta(true);
  }

  function abrirEdicion(item) {
    setEdicion(item);
    setDatos({
      nombre: item.nombre,
      descripcion: item.descripcion,
      presentacion: item.presentacion || "",
      monto: String(precioActual(item)?.monto ?? ""),
      categoriaOriginal: item.categoriaOriginal || "",
      atributos: atributosVacios(item.atributos),
    });
    setDetalle(null);
    setAlta(true);
  }

  async function guardar(evento) {
    evento.preventDefault();
    const fallos = validarProductoProveedor(datos);
    setErrores(fallos);
    if (Object.keys(fallos).length) return;

    const cuerpo = armarCuerpoProducto(datos);

    setEnviando(true);
    try {
      const guardado = edicion
        ? await actualizarProductoProveedor(edicion.id, cuerpo)
        : await crearProductoProveedor(cuerpo);
      setProductos((prev) => {
        const indice = prev.findIndex((item) => item.id === guardado.id);
        if (indice >= 0) {
          const siguiente = [...prev];
          siguiente[indice] = guardado;
          return siguiente;
        }
        return [guardado, ...prev];
      });
      if (!edicion) setCorte("todas");
      marcar(guardado.id);
      cerrarForma();
    } catch (fallo) {
      if (fallo instanceof ApiError) {
        const porCampo = erroresDesdeApi(fallo);
        if (Object.keys(porCampo).length) {
          setErrores({ ...porCampo, general: fallo.detail || "" });
        } else {
          setErrores({
            general: fallo.detail || "No se pudo guardar el producto.",
          });
        }
      } else {
        setErrores({ general: "No se pudo guardar el producto." });
      }
    } finally {
      setEnviando(false);
    }
  }

  async function confirmar(item) {
    setEnviando(true);
    try {
      const actualizado = await confirmarPrecioProveedor(item.id);
      setProductos((prev) =>
        prev.map((fila) => (fila.id === actualizado.id ? actualizado : fila)),
      );
      setDetalle((actual) => (actual?.id === actualizado.id ? actualizado : actual));
      marcar(actualizado.id);
    } catch (fallo) {
      setFalloCarga(
        fallo instanceof ApiError
          ? fallo.detail || "No se pudo confirmar el precio."
          : "No se pudo confirmar el precio.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="pagina bloque mesa-pagina revelar">
      <Contenedor>
        <header className="publicacion-encabezado">
          <Etiqueta>{nombreEmpresa || sesion?.nombre}</Etiqueta>
          <div className="publicacion-encabezado__titulo" id="prov-titulo">
            <h2>Mis productos</h2>
            <button type="button" className="mesa-tutorial" id="prov-tutorial" onClick={() => runTourProveedor()}>
              Tutorial
            </button>
          </div>
          <button type="button" id="prov-agregar" className="btn btn--naranja publicacion-encabezado__cta" onClick={abrirNuevo}>
            Agregar producto
          </button>
          <div className="aviso-oficial">
            <p>
              Aquí llevas los productos que ofreces y el precio vigente de cada uno. Cuando un precio cumple seis
              meses, confírmalo o actualízalo para que tu catálogo siga disponible.
            </p>
          </div>
        </header>

        <div className="mesa">
            <div className="mesa-resumen mesa-resumen--4" id="prov-resumen" role="tablist" aria-label="Estado del catálogo">
            {CORTES.map((item) => {
              const cantidad = resumen[item.id];
              const base = resumen.todas || 1;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={corte === item.id}
                  className={corte === item.id ? "es-activa" : ""}
                  onClick={() => setCorte(item.id)}
                >
                  <strong>{cantidad}</strong>
                  <span>{item.titulo}</span>
                  <div className="track" aria-hidden="true">
                    <i style={{ "--p": `${Math.round((cantidad / base) * 100)}%` }} />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mesa-herramientas" id="prov-herramientas">
            <label id="prov-buscar">
              <span>Buscar</span>
              <input
                type="search"
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                placeholder="Código, producto o descripción"
              />
            </label>
            <label id="prov-presentacion">
              <span>Presentación</span>
              <select value={presentacion} onChange={(evento) => setPresentacion(evento.target.value)}>
                <option value="">Todas</option>
                {PRESENTACIONES_SUGERIDAS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <div className="mesa-leyenda" id="prov-leyenda">
              <span>Vigencia del precio</span>
              <ol>
                {CICLO.map((paso) => (
                  <li key={paso.n} title={paso.texto}>
                    <b>{paso.n}</b>
                    {paso.titulo}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {cargando ? (
            <p className="mesa-vacia" role="status">Cargando catálogo…</p>
          ) : falloCarga ? (
            <p className="acceso__error" role="alert">{falloCarga}</p>
          ) : visibles.length === 0 ? (
            <p className="mesa-vacia">No hay productos en esta vista.</p>
          ) : (
            <div className="tabla-wrap mesa-tabla">
              <table className="tabla tabla--densa">
                <thead>
                  <tr>
                    <Th campo="codigoProveedor" orden={orden} onOrdenar={ordenar}>Código</Th>
                    <Th campo="nombre" orden={orden} onOrdenar={ordenar}>Producto</Th>
                    <th>Descripción</th>
                    <Th campo="presentacion" orden={orden} onOrdenar={ordenar}>Presentación</Th>
                    <Th campo="monto" orden={orden} onOrdenar={ordenar}>Precio c/IVA</Th>
                    <Th campo="fechaPrecio" orden={orden} onOrdenar={ordenar}>Fecha del precio</Th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((item, indice) => {
                    const estado = estadoDe(item);
                    return (
                      <tr key={item.id} className={marcado === item.id ? "mesa-fila--lista" : ""}>
                        <td className="mesa-codigo">{item.codigoProveedor}</td>
                        <td id={indice === 0 ? "prov-ejemplo" : undefined}><strong className="tabla__producto">{item.nombre}</strong></td>
                        <td className="mesa-caract" title={item.descripcion}>{item.descripcion}</td>
                        <td>{item.presentacion}</td>
                        <td className="tabla__precio">{formatearQuetzales(precioActual(item)?.monto)}</td>
                        <td>{formatearFecha(precioActual(item)?.fechaPrecio)}</td>
                        <td id={indice === 0 ? "prov-estado" : undefined}><Estado id={estado} /></td>
                        <td>
                          <div className="mesa-acciones" id={indice === 0 ? "prov-acciones" : undefined}>
                            <button type="button" className="btn btn--linea btn--chico" onClick={() => setDetalle(item)}>
                              Ver
                            </button>
                            <button type="button" className="btn btn--linea btn--chico" onClick={() => abrirEdicion(item)}>
                              Editar
                            </button>
                            {estado !== "vigente" ? (
                              <button type="button" id={indice === 0 ? "prov-confirmar" : undefined} className="btn btn--naranja btn--chico" onClick={() => confirmar(item)}>
                                Confirmar
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Contenedor>

      <Ventana abierto={Boolean(detalle)} onCerrar={() => setDetalle(null)} ancha>
        {detalle ? (
          <Detalle
            item={detalle}
            onCerrar={() => setDetalle(null)}
            onEditar={() => abrirEdicion(detalle)}
            onConfirmar={() => confirmar(detalle)}
          />
        ) : null}
      </Ventana>

      <Ventana abierto={alta} onCerrar={cerrarForma} ancha>
        {alta ? (
          <form className="dialogo-producto__panel formulario" onSubmit={guardar}>
            <header className="dialogo-producto__cab">
              <p className="etiqueta">{edicion ? edicion.codigoProveedor : "Nuevo"}</p>
              <h3>{edicion ? "Editar producto" : "Agregar producto"}</h3>
            </header>
            <div className="dialogo-producto__cuerpo">
              <section className="dialogo-bloque">
                <h4>Producto</h4>
                <p className="dialogo-bloque__texto">
                  Mismos datos que verás en la tabla del catálogo: producto, descripción, presentación y categoría.
                  El código interno ({edicion ? edicion.codigoProveedor : "PD-0001, …"}) lo asigna el sistema al crear.
                </p>
                <div className="prov-campos">
                  <label className="dialogo-fila--ancho">
                    Producto
                    <input
                      name="nombre"
                      value={datos.nombre}
                      onChange={cambiar}
                      maxLength={LIMITES_PRODUCTO.nombre}
                      aria-invalid={Boolean(errores.nombre)}
                      placeholder="Nombre con el que identificas la oferta"
                    />
                    {errores.nombre ? <span className="formulario__error" role="alert">{errores.nombre}</span> : null}
                  </label>
                  <label className="dialogo-fila--ancho">
                    Descripción
                    <textarea
                      name="descripcion"
                      rows={3}
                      value={datos.descripcion}
                      onChange={cambiar}
                      maxLength={LIMITES_PRODUCTO.descripcion}
                      aria-invalid={Boolean(errores.descripcion)}
                      placeholder="Características técnicas, medidas, uso o variante"
                    />
                    {errores.descripcion ? <span className="formulario__error" role="alert">{errores.descripcion}</span> : null}
                  </label>
                  <label>
                    Presentación
                    <input
                      name="presentacion"
                      list="presentaciones-proveedor"
                      value={datos.presentacion}
                      onChange={cambiar}
                      maxLength={LIMITES_PRODUCTO.presentacion}
                      aria-invalid={Boolean(errores.presentacion)}
                      placeholder="Unidad, caja, resma, vial…"
                    />
                    <datalist id="presentaciones-proveedor">
                      {PRESENTACIONES_SUGERIDAS.map((item) => (
                        <option key={item} value={item} />
                      ))}
                    </datalist>
                    {errores.presentacion ? <span className="formulario__error" role="alert">{errores.presentacion}</span> : null}
                  </label>
                  <label className="dialogo-fila--ancho">
                    Categoría
                    {cargandoCategorias ? (
                      <span className="dialogo-bloque__texto">Cargando categorías…</span>
                    ) : (
                      <SelectorCategoria
                        categorias={categorias}
                        valor={datos.categoriaOriginal}
                        permitirTodas={false}
                        etiquetaVacia="Elegir categoría del catálogo INE"
                        invalido={Boolean(errores.categoriaOriginal)}
                        onCambio={(etiqueta) => {
                          setDatos((prev) => ({ ...prev, categoriaOriginal: etiqueta }));
                          setErrores((prev) => ({ ...prev, categoriaOriginal: "" }));
                        }}
                      />
                    )}
                    {errores.categoriaOriginal ? <span className="formulario__error" role="alert">{errores.categoriaOriginal}</span> : null}
                  </label>
                </div>
              </section>
              <section className="dialogo-bloque">
                <h4>Detalle adicional</h4>
                <p className="dialogo-bloque__texto">Opcional. Marca, modelo y especificación se guardan en JSON y no alteran el precio.</p>
                <div className="prov-campos">
                  {ATRIBUTOS.map((campo) => (
                    <label key={campo.clave}>
                      {campo.etiqueta}
                      <input
                        name={`atributo.${campo.clave}`}
                        value={datos.atributos[campo.clave] ?? ""}
                        onChange={cambiar}
                        maxLength={LIMITES_PRODUCTO[campo.clave]}
                        aria-invalid={Boolean(errores[`atributo.${campo.clave}`])}
                      />
                      {errores[`atributo.${campo.clave}`] ? (
                        <span className="formulario__error" role="alert">{errores[`atributo.${campo.clave}`]}</span>
                      ) : null}
                    </label>
                  ))}
                </div>
              </section>
              <section className="dialogo-bloque">
                <h4>Precio vigente</h4>
                <p className="dialogo-bloque__texto">
                  Primer registro en el historial: monto con IVA en quetzales, vigencia de seis meses desde hoy.
                </p>
                <div className="prov-campos">
                  <label>
                    Precio con IVA (Q)
                    <input
                      name="monto"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={datos.monto}
                      onChange={cambiar}
                      aria-invalid={Boolean(errores.monto)}
                      placeholder="0.000"
                    />
                    {errores.monto ? <span className="formulario__error" role="alert">{errores.monto}</span> : null}
                  </label>
                  <div className="prov-solo">
                    <span>Moneda</span>
                    <strong>GTQ</strong>
                  </div>
                  <div className="prov-solo">
                    <span>Fecha de carga</span>
                    <strong>{edicion ? formatearFecha(edicion.createdAt) : "Se registra al guardar"}</strong>
                  </div>
                  <div className="prov-solo">
                    <span>Vigencia hasta</span>
                    <strong>{edicion ? formatearFecha(precioActual(edicion)?.vigenciaHasta) : "Seis meses desde el precio"}</strong>
                  </div>
                </div>
              </section>
            </div>
            {errores.general ? <p className="acceso__error" role="alert">{errores.general}</p> : null}
            <footer className="dialogo-producto__pie">
              <button type="button" className="btn btn--linea" onClick={cerrarForma} disabled={enviando}>Cancelar</button>
              <button type="submit" className="btn btn--naranja" disabled={enviando}>
                {enviando ? "Guardando…" : edicion ? "Guardar cambios" : "Agregar al catálogo"}
              </button>
            </footer>
          </form>
        ) : null}
      </Ventana>
    </section>
  );
}

function Detalle({ item, onCerrar, onEditar, onConfirmar }) {
  const estado = estadoDe(item);
  const actual = precioActual(item);
  const historial = [...(item.precios || [])].sort((a, b) => String(b.fechaPrecio).localeCompare(String(a.fechaPrecio)));
  return (
    <div className="dialogo-producto__panel">
      <header className="dialogo-producto__cab">
        <p className="etiqueta">{item.codigoProveedor}</p>
        <h3>{item.nombre}</h3>
        <div className="dialogo-producto__meta">
          <p className="dialogo-producto__precio">{formatearQuetzales(actual?.monto)}</p>
          <span className="mesa-ref">{actual?.moneda || "GTQ"} · con IVA</span>
          <Estado id={estado} />
        </div>
      </header>
      <div className="dialogo-producto__cuerpo">
        <section className="dialogo-bloque">
          <h4>Estado del precio</h4>
          <p className="dialogo-bloque__texto">{SIGNIFICADO[estado]}</p>
          <dl className="dialogo-filas">
            <Fila etiqueta="Presentación" valor={item.presentacion} />
            <Fila etiqueta="Categoría" valor={item.categoriaOriginal ? tituloCategoria(item.categoriaOriginal) : "Sin categoría"} />
            <Fila etiqueta="Precio con IVA" valor={formatearQuetzales(actual?.monto)} />
            <Fila etiqueta="Moneda" valor={actual?.moneda || "GTQ"} />
            <Fila etiqueta="Fecha de carga" valor={formatearFecha(item.createdAt)} />
            <Fila etiqueta="Fecha del precio" valor={formatearFecha(actual?.fechaPrecio)} />
            <Fila etiqueta="Vigencia hasta" valor={formatearFecha(actual?.vigenciaHasta)} />
            <div className="dialogo-fila dialogo-fila--ancho">
              <dt>Descripción</dt>
              <dd>{item.descripcion}</dd>
            </div>
          </dl>
        </section>
        <section className="dialogo-bloque">
          <h4>Atributos</h4>
          <dl className="dialogo-filas">
            {ATRIBUTOS.map((campo) => (
              <Fila key={campo.clave} etiqueta={campo.etiqueta} valor={item.atributos?.[campo.clave] || "—"} />
            ))}
          </dl>
        </section>
        <section className="dialogo-bloque">
          <h4>Historial de precios</h4>
          <ul className="prov-historial">
            <li className="prov-historial__cab">
              <span>Fecha</span>
              <span>Precio</span>
              <span>Moneda</span>
              <span>Vigencia</span>
            </li>
            {historial.map((fila) => (
              <li key={`${fila.fechaPrecio}-${fila.monto}`}>
                <strong>{formatearFecha(fila.fechaPrecio)}</strong>
                <span>{formatearQuetzales(fila.monto)}</span>
                <span>{fila.moneda}</span>
                <span>{formatearFecha(fila.vigenciaHasta)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <footer className="dialogo-producto__pie">
        <button type="button" className="btn btn--linea" onClick={onEditar}>Editar</button>
        {estado !== "vigente" ? (
          <button type="button" className="btn btn--naranja" onClick={onConfirmar}>Confirmar precio</button>
        ) : null}
        <button type="button" className="btn btn--azul" onClick={onCerrar}>Cerrar</button>
      </footer>
    </div>
  );
}

function valorOrden(item, campo) {
  if (campo === "monto") return precioActual(item)?.monto ?? 0;
  if (campo === "fechaPrecio") return precioActual(item)?.fechaPrecio || "";
  return item[campo];
}

function Fila({ etiqueta, valor }) {
  return (
    <div className="dialogo-fila">
      <dt>{etiqueta}</dt>
      <dd>{valor}</dd>
    </div>
  );
}

function Th({ campo, orden, onOrdenar, children }) {
  const activa = orden.campo === campo;
  return (
    <th>
      <button
        type="button"
        onClick={() => onOrdenar(campo)}
        style={{
          border: 0,
          background: "transparent",
          padding: 0,
          font: "inherit",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: activa ? "var(--azul)" : "#7a8798",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {children} {activa ? (orden.direccion === "asc" ? "↑" : "↓") : ""}
      </button>
    </th>
  );
}

function Estado({ id }) {
  const clase = id === "vigente" ? "chip--ok" : id === "por_confirmar" ? "chip--aviso" : "chip--neutro";
  return <span className={`chip ${clase}`}>{etiquetaEstado(id)}</span>;
}

function Ventana({ abierto, onCerrar, ancha = false, children }) {
  const dialogo = useRef(null);

  useEffect(() => {
    const nodo = dialogo.current;
    if (!nodo) return;
    if (abierto && !nodo.open) nodo.showModal();
    if (!abierto && nodo.open) nodo.close();
  }, [abierto]);

  return (
    <dialog
      ref={dialogo}
      className={ancha ? "dialogo-producto dialogo-producto--ficha" : "dialogo-producto"}
      onClose={onCerrar}
      onClick={(evento) => {
        if (evento.target === dialogo.current) onCerrar();
      }}
    >
      {children}
    </dialog>
  );
}
