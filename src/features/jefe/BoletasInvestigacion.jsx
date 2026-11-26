import { useEffect, useMemo, useRef, useState } from "react";
import { enviarArchivo, solicitar } from "../../servicios/api";
import { fechaCorta, pdfValido } from "./expedienteTrabajoUtil";
import "./boletas.css";

const quetzales = new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" });
const PRECIO = /^\d+(\.\d{1,3})?$/;

function moneda(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? quetzales.format(numero) : "—";
}

function tamano(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function hoy() {
  const fecha = new Date();
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}

function formularioVacio(productoId = "", unidad = "unidad", fuenteId = "") {
  return {
    productoSolicitudId: productoId,
    fuenteId,
    precio: "",
    unidadMedida: unidad,
    fechaConsulta: hoy(),
    evidencia: "",
    observacion: "",
  };
}

const TRAZOS = {
  boleta: "M6 3h12v18l-3-2-3 2-3-2-3 2V3zM9 8h6M9 12h6M9 16h3",
  subir: "M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3",
  pdf: "M7 3h7l5 5v13H7V3zM14 3v5h5",
  check: "M5 12.5l4.5 4.5L19 7.5",
  lapiz: "M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4",
  x: "M6 6l12 12M18 6 6 18",
  mas: "M12 5v14M5 12h14",
};

function Icono({ nombre }) {
  return (
    <svg className="boletas__svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d={TRAZOS[nombre]} />
    </svg>
  );
}

export function BoletasInvestigacion({ detalle, fuentes, ocupado, setError, actuar }) {
  const productos = detalle.productos || [];
  const consultas = detalle.consultas || [];
  const [form, setForm] = useState(() => formularioVacio(productos[0]?.id, productos[0]?.unidadMedida));
  const [archivo, setArchivo] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [errorPrecio, setErrorPrecio] = useState("");
  const [correccion, setCorreccion] = useState(null);
  const formRef = useRef(null);
  const precioRef = useRef(null);

  const resumen = useMemo(() => {
    const porProducto = new Map(productos.map((producto) => [producto.id, []]));
    for (const consulta of consultas) {
      for (const precio of consulta.precios || []) {
        porProducto.get(precio.productoSolicitudId)?.push({ ...precio, consulta });
      }
    }
    return productos.map((producto) => {
      const precios = porProducto.get(producto.id) || [];
      const validos = precios.filter((p) => !p.esAtipico).map((p) => Number(p.precio)).filter(Number.isFinite);
      const suma = validos.reduce((total, valor) => total + valor, 0);
      return {
        producto,
        cantidad: precios.length,
        min: validos.length ? Math.min(...validos) : null,
        max: validos.length ? Math.max(...validos) : null,
        promedio: validos.length ? suma / validos.length : null,
      };
    });
  }, [productos, consultas]);

  const listos = resumen.filter((fila) => fila.cantidad > 0).length;
  const porcentaje = productos.length ? Math.round((listos / productos.length) * 100) : 0;
  const fuenteElegida = fuentes.find((fuente) => fuente.id === form.fuenteId);
  const productoElegido = productos.find((producto) => producto.id === form.productoSolicitudId);

  useEffect(() => {
    if (!form.fuenteId && fuentes[0]) setForm((previo) => ({ ...previo, fuenteId: fuentes[0].id }));
  }, [fuentes, form.fuenteId]);

  useEffect(() => {
    const pendiente = resumen.find((fila) => fila.cantidad === 0)?.producto || productos[0];
    setForm((previo) => formularioVacio(pendiente?.id, pendiente?.unidadMedida, previo.fuenteId));
    setArchivo(null);
  }, [detalle.id]);

  function cambiar(campo, valor) {
    setForm((previo) => ({ ...previo, [campo]: valor }));
    if (campo === "precio") setErrorPrecio("");
  }

  function elegirProducto(producto) {
    setForm((previo) => ({ ...previo, productoSolicitudId: producto.id, unidadMedida: producto.unidadMedida || previo.unidadMedida }));
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => precioRef.current?.focus(), 350);
  }

  function tomarArchivo(lista) {
    const elegido = lista?.[0];
    if (!elegido) return;
    if (!pdfValido(elegido)) {
      setError("La evidencia tiene que ser un PDF de hasta 10 MB.");
      return;
    }
    setError("");
    setArchivo(elegido);
  }

  function registrar(evento) {
    evento.preventDefault();
    const precio = form.precio.trim().replace(",", ".");
    if (!PRECIO.test(precio) || Number(precio) <= 0) {
      setErrorPrecio("Escribe un monto mayor que cero, con hasta 3 decimales (ej. 4300.50).");
      precioRef.current?.focus();
      return;
    }
    const enviado = form;
    const adjunto = archivo;
    actuar(async () => {
      const actual = await solicitar(`/solicitudes/${detalle.id}/consultas`, {
        method: "POST",
        cuerpo: {
          fuenteId: enviado.fuenteId,
          fechaConsulta: enviado.fechaConsulta,
          ...(enviado.evidencia.trim() ? { evidencia: enviado.evidencia.trim() } : {}),
          precios: [{
            productoSolicitudId: enviado.productoSolicitudId,
            precio,
            unidadMedida: enviado.unidadMedida.trim() || "unidad",
            moneda: "GTQ",
            ...(enviado.observacion.trim() ? { observacion: enviado.observacion.trim() } : {}),
          }],
        },
      });
      const consulta = (actual.consultas || []).at(-1);
      if (adjunto && consulta) {
        await enviarArchivo(`/solicitudes/${actual.id}/adjuntos`, adjunto, { consultaId: consulta.id });
      }
      const conBoleta = new Set((actual.consultas || []).flatMap((c) => (c.precios || []).map((p) => p.productoSolicitudId)));
      const siguiente = (actual.productos || []).find((p) => !conBoleta.has(p.id)) || productos.find((p) => p.id === enviado.productoSolicitudId);
      setForm(formularioVacio(siguiente?.id, siguiente?.unidadMedida, enviado.fuenteId));
      setArchivo(null);
      return actual;
    }, { mensajeExito: "Boleta de investigación registrada." });
  }

  function guardarCorreccion(evento) {
    evento.preventDefault();
    const precio = correccion.valor.trim().replace(",", ".");
    if (!PRECIO.test(precio) || Number(precio) <= 0) {
      setError("El precio corregido tiene que ser mayor que cero, con hasta 3 decimales.");
      return;
    }
    const { consultaId, precioId } = correccion;
    actuar(async () => {
      const actual = await solicitar(`/solicitudes/${detalle.id}/consultas/${consultaId}`, {
        method: "PATCH",
        cuerpo: { precios: [{ id: precioId, precio }] },
      });
      setCorreccion(null);
      return actual;
    }, { mensajeExito: "Boleta corregida. El valor anterior queda en el historial." });
  }

  return (
    <section className="boletas" id="mesa-boletas" aria-labelledby="boletas-titulo">
      <header className="boletas__cabeza">
        <span className="boletas__icono"><Icono nombre="boleta" /></span>
        <div className="boletas__intro">
          <h4 id="boletas-titulo">Boletas de investigación</h4>
          <p>
            Cada boleta guarda el precio que observaste de un producto en una fuente y en una fecha. Registra al menos
            una por producto; con varias fuentes el análisis compara mejor.
          </p>
        </div>
        <div className="boletas__avance" aria-label={`${listos} de ${productos.length} productos con boleta`}>
          <strong>{listos}<span>/{productos.length}</span></strong>
          <small>productos con boleta</small>
          <i aria-hidden="true"><b style={{ width: `${porcentaje}%` }} /></i>
        </div>
      </header>

      <ul className="boletas__productos">
        {resumen.map(({ producto, cantidad, min, max, promedio }) => (
          <li key={producto.id} className={cantidad ? "es-listo" : ""}>
            <span className="boletas__estado" aria-hidden="true">{cantidad ? <Icono nombre="check" /> : null}</span>
            <div className="boletas__producto-texto">
              <strong>{producto.nombre}</strong>
              {cantidad ? (
                <span>
                  {cantidad} {cantidad === 1 ? "boleta" : "boletas"}
                  {promedio !== null ? ` · promedio ${moneda(promedio)}` : ""}
                </span>
              ) : (
                <span>Sin boletas todavía</span>
              )}
            </div>
            {min !== null && cantidad > 1 ? (
              <div className="boletas__rango" title="Rango sin precios atípicos">
                <span>Mín <b>{moneda(min)}</b></span>
                <span>Máx <b>{moneda(max)}</b></span>
              </div>
            ) : null}
            <button type="button" className="boletas__btn boletas__btn--suave" onClick={() => elegirProducto(producto)}>
              <Icono nombre="mas" />
              {cantidad ? "Otra boleta" : "Registrar"}
            </button>
          </li>
        ))}
      </ul>

      {consultas.length > 0 ? (
        <div className="boletas__registro">
          <h5>Boletas registradas <span>{consultas.length}</span></h5>
          <ul>
            {[...consultas].reverse().map((consulta) => (
              <li key={consulta.id} className="boletas__tarjeta">
                <header>
                  <div>
                    <strong>{consulta.fuente?.nombre || "Fuente"}</strong>
                    <span>
                      Consultada el {fechaCorta(consulta.fechaConsulta)}
                      {consulta.registradaPor?.nombre ? ` · por ${consulta.registradaPor.nombre}` : ""}
                    </span>
                  </div>
                  {consulta.fuente?.dominio ? <span className="boletas__chip">{consulta.fuente.dominio}</span> : null}
                </header>
                {(consulta.precios || []).map((precio) => {
                  const editando = correccion?.precioId === precio.id;
                  const nombre = productos.find((p) => p.id === precio.productoSolicitudId)?.nombre || "Producto";
                  return (
                    <div key={precio.id} className="boletas__linea">
                      <div className="boletas__linea-producto">
                        <span>{nombre}</span>
                        {precio.esAtipico ? <span className="boletas__chip boletas__chip--alerta">Atípico</span> : null}
                        {precio.observacion ? <small>{precio.observacion}</small> : null}
                      </div>
                      {editando ? (
                        <form className="boletas__corregir" onSubmit={guardarCorreccion}>
                          <span className="boletas__prefijo">Q</span>
                          <input
                            autoFocus
                            value={correccion.valor}
                            onChange={(e) => setCorreccion((previo) => ({ ...previo, valor: e.target.value }))}
                            inputMode="decimal"
                            aria-label={`Precio corregido de ${nombre}`}
                          />
                          <button type="submit" className="boletas__icono-btn boletas__icono-btn--ok" disabled={ocupado} aria-label="Guardar corrección">
                            <Icono nombre="check" />
                          </button>
                          <button type="button" className="boletas__icono-btn" onClick={() => setCorreccion(null)} aria-label="Cancelar corrección">
                            <Icono nombre="x" />
                          </button>
                        </form>
                      ) : (
                        <div className="boletas__linea-precio">
                          <b>{moneda(precio.precio)}</b>
                          <small>por {precio.unidadMedida}</small>
                          <button
                            type="button"
                            className="boletas__icono-btn"
                            onClick={() => setCorreccion({ consultaId: consulta.id, precioId: precio.id, valor: String(precio.precio) })}
                            aria-label={`Corregir precio de ${nombre}`}
                            title="Corregir precio"
                          >
                            <Icono nombre="lapiz" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {consulta.evidencia || consulta.nota ? (
                  <footer>
                    {consulta.evidencia ? <span><b>Evidencia:</b> {consulta.evidencia}</span> : null}
                    {consulta.nota ? <span>{consulta.nota}</span> : null}
                  </footer>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <form ref={formRef} className="boletas__form" onSubmit={registrar} noValidate>
        <header className="boletas__form-cabeza">
          <h5>Nueva boleta</h5>
          <span>Los campos con * son obligatorios</span>
        </header>

        <div className="boletas__grilla">
          <label className="boletas__campo">
            <span>Producto *</span>
            <select value={form.productoSolicitudId} onChange={(e) => {
              const producto = productos.find((p) => p.id === e.target.value);
              setForm((previo) => ({ ...previo, productoSolicitudId: e.target.value, unidadMedida: producto?.unidadMedida || previo.unidadMedida }));
            }}>
              {resumen.map(({ producto, cantidad }) => (
                <option key={producto.id} value={producto.id}>
                  {cantidad ? "✓ " : ""}{producto.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="boletas__campo">
            <span>Fuente consultada *</span>
            <select value={form.fuenteId} onChange={(e) => cambiar("fuenteId", e.target.value)} disabled={!fuentes.length}>
              {fuentes.map((fuente) => <option key={fuente.id} value={fuente.id}>{fuente.nombre}</option>)}
            </select>
            {fuenteElegida?.dominio ? <small>{fuenteElegida.dominio}</small> : null}
          </label>

          <label className={`boletas__campo${errorPrecio ? " es-error" : ""}`}>
            <span>Precio observado *</span>
            <span className="boletas__monto">
              <span className="boletas__prefijo">Q</span>
              <input
                ref={precioRef}
                value={form.precio}
                onChange={(e) => cambiar("precio", e.target.value)}
                inputMode="decimal"
                placeholder="0.00"
                aria-invalid={Boolean(errorPrecio)}
              />
              <span className="boletas__sufijo">con IVA</span>
            </span>
            {errorPrecio ? <small role="alert">{errorPrecio}</small> : null}
          </label>

          <label className="boletas__campo">
            <span>Unidad de medida *</span>
            <input value={form.unidadMedida} onChange={(e) => cambiar("unidadMedida", e.target.value)} maxLength={120} placeholder="unidad, caja, galón…" />
          </label>

          <label className="boletas__campo">
            <span>Fecha de la consulta *</span>
            <input type="date" value={form.fechaConsulta} max={hoy()} onChange={(e) => cambiar("fechaConsulta", e.target.value)} />
          </label>

          <label className="boletas__campo">
            <span>Referencia de la evidencia</span>
            <input value={form.evidencia} onChange={(e) => cambiar("evidencia", e.target.value)} maxLength={500} placeholder="N.º de cotización, enlace o factura" />
          </label>

          <label className="boletas__campo boletas__campo--ancho">
            <span>Observación</span>
            <textarea value={form.observacion} onChange={(e) => cambiar("observacion", e.target.value)} maxLength={500} rows={2} placeholder="Marca, modelo, condiciones de la oferta…" />
          </label>

          <div className="boletas__campo boletas__campo--ancho">
            <span>Respaldo en PDF</span>
            {archivo ? (
              <div className="boletas__archivo">
                <span className="boletas__archivo-icono"><Icono nombre="pdf" /></span>
                <div>
                  <strong>{archivo.name}</strong>
                  <small>{tamano(archivo.size)}</small>
                </div>
                <button type="button" className="boletas__icono-btn" onClick={() => setArchivo(null)} aria-label="Quitar archivo">
                  <Icono nombre="x" />
                </button>
              </div>
            ) : (
              <label
                className={`boletas__zona${arrastrando ? " es-arrastrando" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
                onDragLeave={() => setArrastrando(false)}
                onDrop={(e) => { e.preventDefault(); setArrastrando(false); tomarArchivo(e.dataTransfer.files); }}
              >
                <input type="file" accept="application/pdf,.pdf" onChange={(e) => { tomarArchivo(e.target.files); e.target.value = ""; }} />
                <span className="boletas__zona-icono"><Icono nombre="subir" /></span>
                <strong>Arrastra el PDF aquí o haz clic para elegirlo</strong>
                <small>Cotización, captura o factura · opcional · hasta 10 MB</small>
              </label>
            )}
          </div>
        </div>

        {!fuentes.length ? (
          <p className="boletas__aviso">No hay fuentes de consulta activas. Pide a un administrador que habilite una.</p>
        ) : null}

        <footer className="boletas__form-pie">
          <p>
            {productoElegido && form.precio.trim()
              ? <>Se registrará <b>{moneda(form.precio.replace(",", "."))}</b> por {form.unidadMedida || "unidad"} para <b>{productoElegido.nombre}</b>.</>
              : "Completa el precio para registrar la boleta."}
          </p>
          <button type="submit" className="boletas__btn boletas__btn--principal" disabled={ocupado || !fuentes.length || !productos.length}>
            <Icono nombre="check" />
            {ocupado ? "Registrando…" : "Registrar boleta"}
          </button>
        </footer>
      </form>
    </section>
  );
}
