import { useEffect, useMemo, useRef, useState } from "react";
import { Contenedor } from "../../components/ui/Contenedor";
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
import { AvisosPrecio } from "./AvisosPrecio";
import "./proveedorPage.css";

const CORTES = [
  { id: "todas", titulo: "Productos", nota: "En tu catálogo", tono: "azul", icono: "caja" },
  { id: "vigente", titulo: "Vigentes", nota: "Disponibles para el INE", tono: "lima", icono: "check" },
  { id: "por_confirmar", titulo: "Por confirmar", nota: "Su vigencia venció", tono: "ambar", icono: "reloj" },
  { id: "accion", titulo: "Requieren acción", nota: "Confirma o actualiza", tono: "naranja", icono: "alerta" },
];

const TRAZOS = {
  mas: "M12 5v14M5 12h14",
  buscar: "M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM20 20l-3.5-3.5",
  caja: "M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9zM3 7.5 12 12l9-4.5M12 12v9",
  check: "M5 12.5l4.5 4.5L19 7.5",
  reloj: "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 7.5V12l3 2",
  alerta: "M12 3.5 21.5 20h-19L12 3.5zM12 10v4M12 17h.01",
  ojo: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 9.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z",
  lapiz: "M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4",
};

function Icono({ nombre }) {
  return (
    <svg className="prov-icono" viewBox="0 0 24 24" aria-hidden="true">
      <path d={TRAZOS[nombre]} />
    </svg>
  );
}

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
  const [versionPrecios, setVersionPrecios] = useState(0);
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
      setVersionPrecios((n) => n + 1);
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
      setVersionPrecios((n) => n + 1);
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
    <section className="pagina prov-vista revelar">
      <Contenedor>
        <header className="prov-cabecera">
          <div className="prov-cabecera__texto">
            <p className="prov-kicker">{nombreEmpresa || sesion?.nombre}</p>
            <div className="prov-cabecera__titulo" id="prov-titulo">
              <h1>Mis productos</h1>
              <button type="button" className="mesa-tutorial" id="prov-tutorial" onClick={() => runTourProveedor()}>
                Tutorial
              </button>
            </div>
            <p>
              Aquí llevas los productos que ofreces y el precio vigente de cada uno. Cuando un precio cumple seis
              meses, confírmalo o actualízalo para que tu catálogo siga disponible.
            </p>
          </div>
          <button type="button" id="prov-agregar" className="prov-cta" onClick={abrirNuevo}>
            <Icono nombre="mas" />
            Agregar producto
          </button>
        </header>

        <AvisosPrecio version={versionPrecios} />

        <div className="prov-kpis" id="prov-resumen" role="tablist" aria-label="Estado del catálogo">
          {CORTES.map((item) => {
            const cantidad = resumen[item.id];
            const base = resumen.todas || 1;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={corte === item.id}
                className={`prov-kpi prov-kpi--${item.tono}${corte === item.id ? " es-activo" : ""}`}
                onClick={() => setCorte(item.id)}
              >
                <span className="prov-kpi__icono" aria-hidden="true"><Icono nombre={item.icono} /></span>
                <span className="prov-kpi__texto">
                  <small>{item.titulo}</small>
                  <strong>{cantidad}</strong>
                  <em>{item.nota}</em>
                </span>
                <span className="prov-kpi__track" aria-hidden="true">
                  <i style={{ width: `${Math.round((cantidad / base) * 100)}%` }} />
                </span>
              </button>
            );
          })}
        </div>

        <div className="prov-catalogo">
          <div className="prov-barra" id="prov-herramientas">
            <label className="prov-buscar" id="prov-buscar">
              <span className="sr-only">Buscar</span>
              <Icono nombre="buscar" />
              <input
                type="search"
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                placeholder="Buscar por código, producto o descripción"
              />
            </label>
            <label className="prov-filtro" id="prov-presentacion">
              <span className="sr-only">Presentación</span>
              <select value={presentacion} onChange={(evento) => setPresentacion(evento.target.value)}>
                <option value="">Todas las presentaciones</option>
                {PRESENTACIONES_SUGERIDAS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <div className="prov-leyenda" id="prov-leyenda">
              <span>Vigencia</span>
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
            <p className="prov-vacio" role="status">Cargando catálogo…</p>
          ) : falloCarga ? (
            <p className="acceso__error" role="alert">{falloCarga}</p>
          ) : visibles.length === 0 ? (
            <div className="prov-vacio">
              <Icono nombre="caja" />
              <strong>No hay productos en esta vista</strong>
              <span>Cambia el filtro o agrega un producto nuevo.</span>
            </div>
          ) : (
            <>
              <p className="prov-conteo">
                {visibles.length} {visibles.length === 1 ? "producto" : "productos"}
                {corte !== "todas" ? ` · ${CORTES.find((c) => c.id === corte)?.titulo.toLowerCase()}` : ""}
              </p>
              <div className="prov-tabla-wrap">
                <table className="prov-tabla">
                  <thead>
                    <tr>
                      <Th campo="nombre" orden={orden} onOrdenar={ordenar}>Producto</Th>
                      <Th campo="presentacion" orden={orden} onOrdenar={ordenar}>Presentación</Th>
                      <Th campo="monto" orden={orden} onOrdenar={ordenar}>Precio c/IVA</Th>
                      <Th campo="fechaPrecio" orden={orden} onOrdenar={ordenar}>Fecha del precio</Th>
                      <th>Estado</th>
                      <th><span className="sr-only">Acciones</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibles.map((item, indice) => {
                      const estado = estadoDe(item);
                      const actual = precioActual(item);
                      return (
                        <tr key={item.id} className={`prov-fila prov-fila--${estado}${marcado === item.id ? " es-marcada" : ""}`}>
                          <td id={indice === 0 ? "prov-ejemplo" : undefined}>
                            <div className="prov-producto">
                              <span className="prov-producto__avatar" aria-hidden="true">
                                {(item.nombre || "?").trim().charAt(0).toUpperCase()}
                              </span>
                              <span className="prov-producto__texto">
                                <span className="prov-producto__codigo">{item.codigoProveedor}</span>
                                <strong>{item.nombre}</strong>
                                <span className="prov-producto__desc" title={item.descripcion}>{item.descripcion}</span>
                              </span>
                            </div>
                          </td>
                          <td data-etiqueta="Presentación">
                            <span className="prov-pastilla">{item.presentacion || "—"}</span>
                          </td>
                          <td data-etiqueta="Precio c/IVA" className="prov-precio">
                            {formatearQuetzales(actual?.monto)}
                          </td>
                          <td data-etiqueta="Fecha del precio">
                            <span className="prov-fecha">
                              {formatearFecha(actual?.fechaPrecio)}
                              {actual?.vigenciaHasta ? <small>Vigente hasta {formatearFecha(actual.vigenciaHasta)}</small> : null}
                            </span>
                          </td>
                          <td data-etiqueta="Estado" id={indice === 0 ? "prov-estado" : undefined}>
                            <Estado id={estado} />
                          </td>
                          <td>
                            <div className="prov-acciones" id={indice === 0 ? "prov-acciones" : undefined}>
                              {estado !== "vigente" ? (
                                <button type="button" id={indice === 0 ? "prov-confirmar" : undefined} className="prov-boton prov-boton--naranja" onClick={() => confirmar(item)} disabled={enviando}>
                                  <Icono nombre="check" />
                                  Confirmar
                                </button>
                              ) : null}
                              <button type="button" className="prov-boton" onClick={() => setDetalle(item)}>
                                <Icono nombre="ojo" />
                                Ver
                              </button>
                              <button type="button" className="prov-boton" onClick={() => abrirEdicion(item)}>
                                <Icono nombre="lapiz" />
                                Editar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
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
    <th aria-sort={activa ? (orden.direccion === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" className={`prov-th${activa ? " es-activa" : ""}`} onClick={() => onOrdenar(campo)}>
        {children}
        <span aria-hidden="true">{activa ? (orden.direccion === "asc" ? "↑" : "↓") : "↕"}</span>
      </button>
    </th>
  );
}

function Estado({ id }) {
  return (
    <span className={`prov-estado prov-estado--${id}`}>
      <i aria-hidden="true" />
      {etiquetaEstado(id)}
    </span>
  );
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
      className={`dialogo-producto prov-dialogo${ancha ? " dialogo-producto--ficha" : ""}`}
      onClose={onCerrar}
      onClick={(evento) => {
        if (evento.target === dialogo.current) onCerrar();
      }}
    >
      {children}
    </dialog>
  );
}
