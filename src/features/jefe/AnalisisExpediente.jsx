import { useEffect, useMemo, useState } from "react";
import { solicitar } from "../../servicios/api";
import "./etapas.css";

const quetzales = new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" });
const PRECIO = /^\d+(\.\d{1,3})?$/;

function moneda(valor) {
  if (valor === null || valor === undefined || valor === "") return "—";
  const numero = Number(String(valor).split(" y ")[0]);
  return Number.isFinite(numero) ? quetzales.format(numero) : String(valor);
}

function decimal(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? String(Number(numero.toFixed(2))) : "";
}

const TRAZOS = {
  grafica: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  check: "M5 12.5l4.5 4.5L19 7.5",
  flecha: "M9 6l6 6-6 6",
  ojo: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 9.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z",
  ojoNo: "M3 3l18 18M10.6 6A9.6 9.6 0 0 1 12 5.5C18 5.5 21.5 12 21.5 12a17 17 0 0 1-3 3.7M6.3 6.9A17 17 0 0 0 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1",
};

function Icono({ nombre }) {
  return (
    <svg className="etapa__svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d={TRAZOS[nombre]} />
    </svg>
  );
}

function criterios(medidas) {
  const n = medidas?.incluidos?.length || 0;
  if (!n) return [];
  const lista = [
    { id: "mediana", texto: `Se adopta la mediana de ${n} precio${n === 1 ? "" : "s"} comparable${n === 1 ? "" : "s"}, que reduce el efecto de valores extremos.` },
    { id: "media", texto: `Se adopta la media de ${n} precio${n === 1 ? "" : "s"} comparable${n === 1 ? "" : "s"} consultados en fuentes de Guatemala.` },
    { id: "minimo", texto: "Se adopta el precio más bajo observado que cumple con las especificaciones solicitadas." },
  ];
  if (medidas.moda) lista.push({ id: "moda", texto: `Se adopta la moda, el precio que más se repite entre las fuentes consultadas (${n} comparables).` });
  return lista;
}

export function AnalisisExpediente({ detalle, ocupado, actuar }) {
  const productos = detalle.productos || [];
  const validaciones = detalle.validaciones || [];
  const [estadisticas, setEstadisticas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [abierto, setAbierto] = useState(null);

  const huella = useMemo(
    () => (detalle.consultas || []).flatMap((c) => (c.precios || []).map((p) => `${p.id}:${p.esAtipico}:${p.precio}`)).join("|"),
    [detalle.consultas],
  );

  useEffect(() => {
    let viva = true;
    setCargando(true);
    solicitar(`/solicitudes/${detalle.id}/estadisticas`)
      .then((datos) => { if (viva) setEstadisticas(datos); })
      .catch(() => { if (viva) setEstadisticas(null); })
      .finally(() => { if (viva) setCargando(false); });
    return () => { viva = false; };
  }, [detalle.id, huella]);

  useEffect(() => {
    if (abierto && productos.some((p) => p.id === abierto)) return;
    const pendiente = productos.find((p) => !validaciones.some((v) => v.productoSolicitudId === p.id && v.confirmada));
    setAbierto((pendiente || productos[0])?.id || null);
  }, [detalle.id]);

  const confirmados = productos.filter((p) => validaciones.some((v) => v.productoSolicitudId === p.id && v.confirmada)).length;

  return (
    <section className="etapa" aria-labelledby="analisis-titulo">
      <header className="etapa__cabeza">
        <span className="etapa__icono"><Icono nombre="grafica" /></span>
        <div>
          <h4 id="analisis-titulo">Análisis de precios</h4>
          <p>
            Revisa los precios de cada producto, descarta los atípicos y confirma el precio de referencia con su criterio.
            La media, la mediana y la moda se recalculan solas.
          </p>
        </div>
        <div className="etapa__avance" aria-label={`${confirmados} de ${productos.length} precios confirmados`}>
          <strong>{confirmados}<span>/{productos.length}</span></strong>
          <small>precios confirmados</small>
          <i aria-hidden="true"><b style={{ width: `${productos.length ? (confirmados / productos.length) * 100 : 0}%` }} /></i>
        </div>
      </header>

      <div className="etapa__productos">
        {productos.map((producto) => (
          <ProductoAnalisis
            key={producto.id}
            detalle={detalle}
            producto={producto}
            medidas={estadisticas?.productos?.find((m) => m.productoSolicitudId === producto.id)}
            validacion={validaciones.find((v) => v.productoSolicitudId === producto.id)}
            cargando={cargando}
            abierto={abierto === producto.id}
            onAlternar={() => setAbierto((actual) => (actual === producto.id ? null : producto.id))}
            ocupado={ocupado}
            actuar={actuar}
          />
        ))}
      </div>
    </section>
  );
}

function ProductoAnalisis({ detalle, producto, medidas, validacion, cargando, abierto, onAlternar, ocupado, actuar }) {
  const unidad = producto.unidadMedida || "unidad";
  const precios = useMemo(
    () => (detalle.consultas || []).flatMap((consulta) =>
      (consulta.precios || [])
        .filter((p) => p.productoSolicitudId === producto.id)
        .map((p) => ({ ...p, fuente: consulta.fuente?.nombre || "Fuente", fecha: consulta.fechaConsulta })),
    ),
    [detalle.consultas, producto.id],
  );
  const maximo = Math.max(1, ...precios.map((p) => Number(p.precio) || 0));
  const mediana = medidas?.mediana ? Number(medidas.mediana) : null;
  const otrasExclusiones = (medidas?.excluidos || []).filter((e) => e.motivo !== "Marcado como atípico");
  const hayAtipicos = precios.some((p) => p.esAtipico);

  const [form, setForm] = useState({ precioAdoptado: "", criterio: "", notaAtipicos: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      precioAdoptado: validacion ? String(Number(validacion.precioAdoptado)) : "",
      criterio: validacion?.criterio || "",
      notaAtipicos: validacion?.notaAtipicos || "",
    });
    setError("");
  }, [validacion?.id, validacion?.confirmada, validacion?.precioAdoptado]);

  const sugerencias = [
    medidas?.mediana ? { id: "mediana", etiqueta: "Mediana", valor: medidas.mediana } : null,
    medidas?.media ? { id: "media", etiqueta: "Media", valor: medidas.media } : null,
    medidas?.incluidos?.length
      ? { id: "minimo", etiqueta: "Mínimo", valor: String(Math.min(...medidas.incluidos.map((p) => Number(p.precio)))) }
      : null,
  ].filter(Boolean);

  function guardar(confirmar) {
    const precio = form.precioAdoptado.trim().replace(",", ".");
    if (!PRECIO.test(precio) || Number(precio) <= 0) {
      setError("Escribe un precio mayor que cero, con hasta 3 decimales.");
      return;
    }
    if (form.criterio.trim().length < 3) {
      setError("Explica el criterio con el que adoptas el precio.");
      return;
    }
    setError("");
    actuar(() => solicitar(`/solicitudes/${detalle.id}/validaciones`, {
      method: "POST",
      cuerpo: {
        productoSolicitudId: producto.id,
        precioAdoptado: precio,
        moneda: "GTQ",
        unidadMedida: unidad,
        criterio: form.criterio.trim(),
        ...(form.notaAtipicos.trim() ? { notaAtipicos: form.notaAtipicos.trim() } : {}),
        confirmar,
      },
    }), { mensajeExito: confirmar ? `Precio de referencia confirmado para ${producto.nombre}.` : "Borrador del análisis guardado." });
  }

  function alternarAtipico(precio) {
    actuar(() => solicitar(`/solicitudes/${detalle.id}/atipicos`, {
      method: "POST",
      cuerpo: { precioConsultadoId: precio.id, esAtipico: !precio.esAtipico },
    }), { mensajeExito: precio.esAtipico ? "El precio vuelve a contar en el análisis." : "Precio marcado como atípico; ya no cuenta en la estadística." });
  }

  const estado = validacion?.confirmada ? "confirmado" : validacion ? "borrador" : "pendiente";

  return (
    <article className={`etapa__producto etapa__producto--${estado}${abierto ? " es-abierto" : ""}`}>
      <button type="button" className="etapa__producto-cabeza" onClick={onAlternar} aria-expanded={abierto}>
        <span className="etapa__producto-marca" aria-hidden="true">{estado === "confirmado" ? <Icono nombre="check" /> : null}</span>
        <span className="etapa__producto-texto">
          <strong>{producto.nombre}</strong>
          <small>{precios.length} {precios.length === 1 ? "precio consultado" : "precios consultados"} · por {unidad}</small>
        </span>
        <span className={`etapa__chip etapa__chip--${estado}`}>
          {estado === "confirmado" ? `Confirmado · ${moneda(validacion.precioAdoptado)}` : estado === "borrador" ? "Borrador" : "Por confirmar"}
        </span>
        <span className="etapa__flecha"><Icono nombre="flecha" /></span>
      </button>

      {abierto ? (
        <div className="etapa__producto-cuerpo">
          <div className="etapa__medidas">
            <Medida etiqueta="Comparables" valor={cargando ? "…" : String(medidas?.incluidos?.length ?? 0)} />
            <Medida etiqueta="Media" valor={cargando ? "…" : moneda(medidas?.media)} />
            <Medida etiqueta="Mediana" valor={cargando ? "…" : moneda(medidas?.mediana)} destacada />
            <Medida etiqueta="Moda" valor={cargando ? "…" : medidas?.moda ? moneda(medidas.moda) : "Sin moda"} />
          </div>

          {precios.length === 0 ? (
            <p className="etapa__aviso">Este producto no tiene boletas. Regístralas en «Boletas de investigación» para poder analizarlo.</p>
          ) : (
            <div className="etapa__grafica" role="list" aria-label={`Precios consultados de ${producto.nombre}`}>
              {precios.map((precio) => {
                const valor = Number(precio.precio) || 0;
                return (
                  <div key={precio.id} role="listitem" className={`etapa__barra${precio.esAtipico ? " es-atipico" : ""}`}>
                    <span className="etapa__barra-fuente" title={precio.fuente}>{precio.fuente}</span>
                    <span className="etapa__barra-pista">
                      <i style={{ width: `${(valor / maximo) * 100}%` }} />
                      {mediana ? <em style={{ left: `${(mediana / maximo) * 100}%` }} title={`Mediana ${moneda(mediana)}`} /> : null}
                    </span>
                    <b>{moneda(valor)}</b>
                    <button
                      type="button"
                      className="etapa__icono-btn"
                      onClick={() => alternarAtipico(precio)}
                      disabled={ocupado}
                      title={precio.esAtipico ? "Volver a incluir en el análisis" : "Marcar como atípico"}
                      aria-label={precio.esAtipico ? `Incluir precio de ${precio.fuente}` : `Marcar como atípico el precio de ${precio.fuente}`}
                    >
                      <Icono nombre={precio.esAtipico ? "ojoNo" : "ojo"} />
                    </button>
                  </div>
                );
              })}
              {mediana ? <p className="etapa__leyenda"><em aria-hidden="true" /> Línea naranja: mediana · ojo tachado: precio atípico, no cuenta</p> : null}
            </div>
          )}

          {otrasExclusiones.length ? (
            <p className="etapa__aviso">
              {otrasExclusiones.length === 1 ? "Un precio no cuenta" : `${otrasExclusiones.length} precios no cuentan`} en la estadística:{" "}
              {otrasExclusiones.map((e) => `${e.fuente} (${e.motivo.toLowerCase()})`).join(", ")}. Corrige la boleta si fue un error.
            </p>
          ) : null}

          {medidas?.interpretacion && medidas.incluidos?.length ? <p className="etapa__nota">{medidas.interpretacion}</p> : null}

          <form className="etapa__form" onSubmit={(e) => { e.preventDefault(); guardar(true); }} noValidate>
            <div className="etapa__campo">
              <span>Precio de referencia adoptado *</span>
              <span className="etapa__monto">
                <span className="etapa__prefijo">Q</span>
                <input
                  value={form.precioAdoptado}
                  onChange={(e) => setForm((previo) => ({ ...previo, precioAdoptado: e.target.value }))}
                  inputMode="decimal"
                  placeholder="0.00"
                  aria-label="Precio de referencia adoptado"
                />
                <span className="etapa__sufijo">por {unidad}</span>
              </span>
              {sugerencias.length ? (
                <div className="etapa__sugerencias">
                  <span>Usar:</span>
                  {sugerencias.map((s) => (
                    <button key={s.id} type="button" onClick={() => setForm((previo) => ({ ...previo, precioAdoptado: decimal(s.valor) }))}>
                      {s.etiqueta} {moneda(s.valor)}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <label className="etapa__campo">
              <span>Criterio *</span>
              <textarea
                value={form.criterio}
                onChange={(e) => setForm((previo) => ({ ...previo, criterio: e.target.value }))}
                rows={3}
                maxLength={1000}
                placeholder="Explica por qué adoptas este precio."
              />
              {criterios(medidas).length ? (
                <div className="etapa__sugerencias">
                  <span>Plantillas:</span>
                  {criterios(medidas).map((c) => (
                    <button key={c.id} type="button" onClick={() => setForm((previo) => ({ ...previo, criterio: c.texto }))}>
                      {c.id === "mediana" ? "Mediana" : c.id === "media" ? "Media" : c.id === "moda" ? "Moda" : "Precio más bajo"}
                    </button>
                  ))}
                </div>
              ) : null}
            </label>

            {hayAtipicos ? (
              <label className="etapa__campo">
                <span>Nota sobre los atípicos</span>
                <textarea
                  value={form.notaAtipicos}
                  onChange={(e) => setForm((previo) => ({ ...previo, notaAtipicos: e.target.value }))}
                  rows={2}
                  maxLength={1000}
                  placeholder="Por qué se descartaron (precio de otra especificación, oferta temporal…)."
                />
              </label>
            ) : null}

            {error ? <p className="etapa__error" role="alert">{error}</p> : null}

            {validacion?.confirmada ? (
              <p className="etapa__confirmado">
                <Icono nombre="check" />
                Confirmado por {validacion.confirmadaPor?.nombre || "el analista"}
                {validacion.confirmadaEn ? ` el ${new Date(validacion.confirmadaEn).toLocaleDateString("es-GT")}` : ""}. Si cambias algo, vuelve a confirmarlo.
              </p>
            ) : null}

            <footer className="etapa__pie">
              <button type="button" className="etapa__btn etapa__btn--linea" disabled={ocupado} onClick={() => guardar(false)}>
                Guardar borrador
              </button>
              <button type="submit" className="etapa__btn etapa__btn--principal" disabled={ocupado}>
                <Icono nombre="check" />
                {validacion?.confirmada ? "Volver a confirmar" : "Confirmar precio"}
              </button>
            </footer>
          </form>
        </div>
      ) : null}
    </article>
  );
}

function Medida({ etiqueta, valor, destacada = false }) {
  return (
    <div className={`etapa__medida${destacada ? " es-destacada" : ""}`}>
      <small>{etiqueta}</small>
      <strong>{valor}</strong>
    </div>
  );
}
