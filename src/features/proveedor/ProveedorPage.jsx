import { useEffect, useMemo, useRef, useState } from "react";
import { Contenedor } from "../../components/ui/Contenedor";
import { Etiqueta } from "../../components/ui/Etiqueta";
import { CATEGORIAS, CATEGORIA_POR_ID } from "../../data/categorias";
import { formatearFecha, formatearQuetzales } from "../../data/precios";
import {
  PRODUCTOS_INICIALES,
  PROVEEDOR,
  atributosVacios,
  estadoDe,
  etiquetaEstado,
  plantillaDe,
  precioSinIva,
} from "../../data/ofertasProveedor";
import { runTourProveedor, useTourProveedor } from "./tourProveedor";

const PRESENTACIONES = ["Unidad", "Resma", "Ciento", "Caja"];
const CATEGORIA_INICIAL = "papeleria-y-articulos-de-libreria";
const VACIO = {
  producto: "",
  descripcion: "",
  presentacion: "Unidad",
  precioConIva: "",
  categoriaId: CATEGORIA_INICIAL,
  condiciones: "",
  atributos: atributosVacios(CATEGORIA_INICIAL),
};

const CORTES = [
  { id: "todas", titulo: "Productos" },
  { id: "vigente", titulo: "Vigentes" },
  { id: "por_confirmar", titulo: "Por confirmar" },
  { id: "no_reconfirmado", titulo: "No reconfirmados" },
  { id: "accion", titulo: "Requieren acción" },
];

const CICLO = [
  { n: "01", titulo: "Vigente", texto: "Precio actualizado en los últimos 6 meses." },
  { n: "02", titulo: "Por confirmar", texto: "Pasaron 6 meses. Hay 48 horas para responder." },
  { n: "03", titulo: "Confirmas", texto: "Si confirmas o cambias el precio, vuelve a vigente." },
  { n: "04", titulo: "Sin respuesta", texto: "Sigue visible, marcado como no reconfirmado." },
];

const SIGNIFICADO = {
  vigente: "Este precio está al día. El INE puede usarlo como fuente al armar un precio de referencia.",
  por_confirmar: "Pasaron 6 meses desde la última actualización. Confírmalo o cámbialo para que siga vigente.",
  no_reconfirmado: "No hubo respuesta en el plazo. El precio sigue en el catálogo, pero el informe del INE lo cuenta aparte.",
};

export function ProveedorPage() {
  const [productos, setProductos] = useState(PRODUCTOS_INICIALES);
  const [corte, setCorte] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [presentacion, setPresentacion] = useState("");
  const [orden, setOrden] = useState({ campo: "producto", direccion: "asc" });
  const [detalle, setDetalle] = useState(null);
  const [alta, setAlta] = useState(false);
  const [edicion, setEdicion] = useState(null);
  const [datos, setDatos] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [marcado, setMarcado] = useState(null);
  useTourProveedor();

  const resumen = useMemo(() => {
    const conteo = { todas: productos.length, vigente: 0, por_confirmar: 0, no_reconfirmado: 0, accion: 0 };
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
      if (corte === "no_reconfirmado" && estado !== "no_reconfirmado") return false;
      if (corte === "accion" && estado === "vigente") return false;
      if (presentacion && item.presentacion !== presentacion) return false;
      if (!texto) return true;
      return `${item.codigo} ${item.producto} ${item.descripcion}`.toLowerCase().includes(texto);
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
      return;
    }
    if (name === "categoriaId") {
      setDatos((prev) => ({
        ...prev,
        categoriaId: value,
        atributos: atributosVacios(value, prev.atributos),
      }));
      return;
    }
    setDatos((prev) => ({ ...prev, [name]: value }));
    setErrores((prev) => ({ ...prev, [name]: "" }));
  }

  function cerrarForma() {
    setAlta(false);
    setEdicion(null);
    setDatos(VACIO);
    setErrores({});
  }

  function marcar(id) {
    setMarcado(id);
    window.setTimeout(() => setMarcado((actual) => (actual === id ? null : actual)), 900);
  }

  function abrirNuevo() {
    setEdicion(null);
    setDatos(VACIO);
    setAlta(true);
  }

  function abrirEdicion(item) {
    setEdicion(item);
    setDatos({
      producto: item.producto,
      descripcion: item.descripcion,
      presentacion: item.presentacion,
      precioConIva: String(item.precioConIva),
      categoriaId: item.categoriaId,
      condiciones: item.condiciones,
      atributos: atributosVacios(item.categoriaId, item.atributos),
    });
    setDetalle(null);
    setAlta(true);
  }

  function guardar(evento) {
    evento.preventDefault();
    const precioConIva = Number(datos.precioConIva);
    const fallos = {};
    if (!datos.producto.trim()) fallos.producto = "Escribe el nombre con el que identificas el producto.";
    if (!datos.descripcion.trim()) fallos.descripcion = "Agrega una descripción para distinguirlo de otros parecidos.";
    if (!Number.isFinite(precioConIva) || precioConIva <= 0) fallos.precioConIva = "Indica un precio con IVA mayor a cero.";
    setErrores(fallos);
    if (Object.keys(fallos).length) return;
    const hoy = fechaHoy();
    const limpio = {
      producto: datos.producto.trim(),
      descripcion: datos.descripcion.trim(),
      presentacion: datos.presentacion,
      categoriaId: datos.categoriaId,
      condiciones: datos.condiciones.trim(),
      atributos: atributosVacios(datos.categoriaId, datos.atributos),
      precioConIva,
    };
    if (edicion) {
      const cambio = edicion.precioConIva !== precioConIva;
      setProductos((prev) =>
        prev.map((item) =>
          item.id === edicion.id
            ? {
                ...item,
                ...limpio,
                fechaCarga: item.fechaCarga,
                fechaActualizacion: cambio ? hoy : item.fechaActualizacion,
                sinRespuesta: cambio ? false : item.sinRespuesta,
                historial: cambio
                  ? [...item.historial, { precioConIva, fecha: hoy, motivo: "Cambio de precio", autor: PROVEEDOR }]
                  : item.historial,
              }
            : item
        )
      );
    } else {
      const n = productos.reduce((max, item) => Math.max(max, Number(item.codigo.replace(/\D/g, "")) || 0), 0) + 1;
      const id = `pd-${Date.now()}`;
      setProductos((prev) => [
        {
          id,
          codigo: `PD-${String(n).padStart(4, "0")}`,
          fechaCarga: hoy,
          fechaActualizacion: hoy,
          sinRespuesta: false,
          historial: [{ precioConIva, fecha: hoy, motivo: "Carga inicial", autor: PROVEEDOR }],
          ...limpio,
        },
        ...prev,
      ]);
      setCorte("todas");
      marcar(id);
    }
    if (edicion) marcar(edicion.id);
    cerrarForma();
  }

  function confirmar(item) {
    const hoy = fechaHoy();
    setProductos((prev) =>
      prev.map((fila) =>
        fila.id === item.id
          ? {
              ...fila,
              fechaActualizacion: hoy,
              sinRespuesta: false,
              historial: [...fila.historial, { precioConIva: fila.precioConIva, fecha: hoy, motivo: "Confirmación", autor: PROVEEDOR }],
            }
          : fila
      )
    );
    setDetalle(null);
    marcar(item.id);
  }

  return (
    <section className="pagina bloque mesa-pagina revelar">
      <Contenedor>
        <header className="publicacion-encabezado">
          <Etiqueta>{PROVEEDOR}</Etiqueta>
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
          <div className="mesa-resumen" id="prov-resumen" role="tablist" aria-label="Estado del catálogo">
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
                {PRESENTACIONES.map((item) => (
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

          {visibles.length === 0 ? (
            <p className="mesa-vacia">No hay productos en esta vista.</p>
          ) : (
            <div className="tabla-wrap mesa-tabla">
              <table className="tabla tabla--densa">
                <thead>
                  <tr>
                    <Th campo="codigo" orden={orden} onOrdenar={ordenar}>Código</Th>
                    <Th campo="producto" orden={orden} onOrdenar={ordenar}>Producto</Th>
                    <th>Descripción</th>
                    <Th campo="presentacion" orden={orden} onOrdenar={ordenar}>Presentación</Th>
                    <Th campo="precioConIva" orden={orden} onOrdenar={ordenar}>Precio c/IVA</Th>
                    <Th campo="fechaActualizacion" orden={orden} onOrdenar={ordenar}>Actualización</Th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((item, indice) => {
                    const estado = estadoDe(item);
                    return (
                      <tr key={item.id} className={marcado === item.id ? "mesa-fila--lista" : ""}>
                        <td className="mesa-codigo">{item.codigo}</td>
                        <td id={indice === 0 ? "prov-ejemplo" : undefined}><strong className="tabla__producto">{item.producto}</strong></td>
                        <td className="mesa-caract" title={item.descripcion}>{item.descripcion}</td>
                        <td>{item.presentacion}</td>
                        <td className="tabla__precio">{formatearQuetzales(item.precioConIva)}</td>
                        <td>{formatearFecha(item.fechaActualizacion)}</td>
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
              <p className="etiqueta">{edicion ? edicion.codigo : "Nuevo"}</p>
              <h3>{edicion ? "Editar producto" : "Agregar producto"}</h3>
            </header>
            <div className="dialogo-producto__cuerpo">
              <section className="dialogo-bloque">
                <h4>Producto</h4>
                <div className="prov-campos">
                  <label className="dialogo-fila--ancho">
                    Nombre
                    <input name="producto" value={datos.producto} onChange={cambiar} aria-invalid={Boolean(errores.producto)} />
                    {errores.producto ? <span className="formulario__error" role="alert">{errores.producto}</span> : null}
                  </label>
                  <label className="dialogo-fila--ancho">
                    Descripción
                    <textarea name="descripcion" rows={3} value={datos.descripcion} onChange={cambiar} aria-invalid={Boolean(errores.descripcion)} />
                    {errores.descripcion ? <span className="formulario__error" role="alert">{errores.descripcion}</span> : null}
                  </label>
                  <label>
                    Presentación
                    <select name="presentacion" value={datos.presentacion} onChange={cambiar}>
                      {PRESENTACIONES.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Categoría
                    <select name="categoriaId" value={datos.categoriaId} onChange={cambiar}>
                      {CATEGORIAS.map((item) => (
                        <option key={item.id} value={item.id}>{item.nombre}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>
              <section className="dialogo-bloque">
                <h4>Atributos</h4>
                <p className="dialogo-bloque__texto">Cambian según la categoría y describen el producto. No se suman al precio.</p>
                <div className="prov-campos">
                  {plantillaDe(datos.categoriaId).map((campo) => (
                    <label key={campo.clave}>
                      {campo.etiqueta}
                      <input
                        name={`atributo.${campo.clave}`}
                        value={datos.atributos[campo.clave] ?? ""}
                        onChange={cambiar}
                      />
                    </label>
                  ))}
                </div>
              </section>
              <section className="dialogo-bloque">
                <h4>Precio</h4>
                <div className="prov-campos">
                  <label>
                    Precio con IVA (Q)
                    <input name="precioConIva" type="number" min="0" step="0.01" value={datos.precioConIva} onChange={cambiar} aria-invalid={Boolean(errores.precioConIva)} />
                    {errores.precioConIva ? <span className="formulario__error" role="alert">{errores.precioConIva}</span> : null}
                  </label>
                  <div className="prov-solo">
                    <span>Precio sin IVA</span>
                    <strong>
                      {precioVista(datos.precioConIva)
                        ? formatearQuetzales(precioSinIva(datos.precioConIva))
                        : "Se calcula al escribir el precio"}
                    </strong>
                  </div>
                  <label className="dialogo-fila--ancho">
                    Condiciones
                    <input name="condiciones" value={datos.condiciones} onChange={cambiar} placeholder="Entrega o garantía, si aplica" />
                    <span className="formulario__ayuda">No se suman al precio. Sirven para dejar claro cómo entregas el producto.</span>
                  </label>
                  <div className="prov-solo">
                    <span>Fecha de carga</span>
                    <strong>{edicion ? formatearFecha(edicion.fechaCarga) : "Se registra al guardar"}</strong>
                  </div>
                  <div className="prov-solo">
                    <span>Última actualización</span>
                    <strong>{edicion ? formatearFecha(edicion.fechaActualizacion) : "Se registra al guardar"}</strong>
                  </div>
                </div>
              </section>
            </div>
            <footer className="dialogo-producto__pie">
              <button type="button" className="btn btn--linea" onClick={cerrarForma}>Cancelar</button>
              <button type="submit" className="btn btn--naranja">{edicion ? "Guardar cambios" : "Agregar al catálogo"}</button>
            </footer>
          </form>
        ) : null}
      </Ventana>
    </section>
  );
}

function Detalle({ item, onCerrar, onEditar, onConfirmar }) {
  const estado = estadoDe(item);
  const categoria = CATEGORIA_POR_ID[item.categoriaId]?.nombre ?? "Sin categoría";
  const historial = [...item.historial].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  return (
    <div className="dialogo-producto__panel">
      <header className="dialogo-producto__cab">
        <p className="etiqueta">{item.codigo}</p>
        <h3>{item.producto}</h3>
        <div className="dialogo-producto__meta">
          <p className="dialogo-producto__precio">{formatearQuetzales(item.precioConIva)}</p>
          <span className="mesa-ref">con IVA · sin IVA {formatearQuetzales(precioSinIva(item.precioConIva))}</span>
          <Estado id={estado} />
        </div>
      </header>
      <div className="dialogo-producto__cuerpo">
        <section className="dialogo-bloque">
          <h4>Estado del precio</h4>
          <p className="dialogo-bloque__texto">{SIGNIFICADO[estado]}</p>
          <dl className="dialogo-filas">
            <Fila etiqueta="Presentación" valor={item.presentacion} />
            <Fila etiqueta="Categoría" valor={categoria} />
            <Fila etiqueta="Precio con IVA" valor={formatearQuetzales(item.precioConIva)} />
            <Fila etiqueta="Precio sin IVA" valor={formatearQuetzales(precioSinIva(item.precioConIva))} />
            <Fila etiqueta="Fecha de carga" valor={formatearFecha(item.fechaCarga)} />
            <Fila etiqueta="Última actualización" valor={formatearFecha(item.fechaActualizacion)} />
            <div className="dialogo-fila dialogo-fila--ancho">
              <dt>Condiciones</dt>
              <dd>{item.condiciones || "Sin condiciones adicionales"}</dd>
            </div>
            <div className="dialogo-fila dialogo-fila--ancho">
              <dt>Descripción</dt>
              <dd>{item.descripcion}</dd>
            </div>
          </dl>
        </section>
        <section className="dialogo-bloque">
          <h4>Atributos</h4>
          <dl className="dialogo-filas">
            {plantillaDe(item.categoriaId).map((campo) => (
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
              <span>Motivo</span>
              <span>Quién</span>
            </li>
            {historial.map((fila) => (
              <li key={`${fila.fecha}-${fila.motivo}-${fila.precioConIva}`}>
                <strong>{formatearFecha(fila.fecha)}</strong>
                <span>{formatearQuetzales(fila.precioConIva)}</span>
                <span>{fila.motivo}</span>
                <span>{fila.autor || PROVEEDOR}</span>
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

function precioVista(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0;
}

function valorOrden(item, campo) {
  if (campo === "precioConIva") return item.precioConIva;
  if (campo === "fechaActualizacion") return item.fechaActualizacion;
  return item[campo];
}

function fechaHoy() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
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
