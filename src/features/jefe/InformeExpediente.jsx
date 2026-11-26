import { useEffect, useState } from "react";
import { solicitar } from "../../servicios/api";
import "./etapas.css";

const quetzales = new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" });
const TIPOS = { INFORME_TECNICO: "Informe técnico", OFICIO: "Oficio" };
const TITULOS = new Set([
  "Informe técnico",
  "Oficio",
  "Estadística de los precios comparables",
  "Precios de referencia que el analista dejó confirmados:",
]);
const MEMBRETE = new Set(["Instituto Nacional de Estadística", "Dirección de Precios e Índices de Referencia"]);

const TRAZOS = {
  documento: "M7 3h7l5 5v13H7V3zM14 3v5h5M10 13h6M10 17h6",
  lapiz: "M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4",
  imprimir: "M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7v-7z",
  sello: "M5 12.5l4.5 4.5L19 7.5",
  mas: "M12 5v14M5 12h14",
};

function Icono({ nombre }) {
  return (
    <svg className="etapa__svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d={TRAZOS[nombre]} />
    </svg>
  );
}

function moneda(valor) {
  const numero = Number(String(valor ?? "").split(" y ")[0]);
  return valor && Number.isFinite(numero) ? quetzales.format(numero) : "—";
}

function fecha(iso) {
  return iso ? new Date(iso).toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" }) : "";
}

function nombreDoc(informe) {
  return `${TIPOS[informe.tipo] || informe.tipo} v${informe.version}`;
}

function bloques(texto) {
  return String(texto || "").split("\n").map((linea) => linea.trim()).filter(Boolean).map((linea) => {
    if (MEMBRETE.has(linea)) return { tipo: "membrete", linea };
    if (TITULOS.has(linea)) return { tipo: "titulo", linea: linea.replace(/:$/, "") };
    if (/^\d+\.\s/.test(linea)) return { tipo: "item", linea };
    if (/^[A-ZÁÉÍÓÚ][\wáéíóúñ ]+: /.test(linea) && linea.length < 160) {
      const [clave, ...resto] = linea.split(": ");
      return { tipo: "dato", clave, valor: resto.join(": ").replace(/\.$/, "") };
    }
    return { tipo: "parrafo", linea };
  });
}

function escapar(valor) {
  return String(valor).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function imprimir(informe, detalle) {
  const cuerpo = bloques(informe.resumen).map((b) => {
    if (b.tipo === "membrete") return `<p class="membrete">${escapar(b.linea)}</p>`;
    if (b.tipo === "titulo") return `<h2>${escapar(b.linea)}</h2>`;
    if (b.tipo === "item") return `<p class="item">${escapar(b.linea)}</p>`;
    if (b.tipo === "dato") return `<p class="dato"><b>${escapar(b.clave)}:</b> ${escapar(b.valor)}</p>`;
    return `<p>${escapar(b.linea)}</p>`;
  }).join("");
  const sello = informe.estado === "EMITIDO"
    ? `<p class="sello">Emitido el ${escapar(fecha(informe.emitidoEn))}</p>`
    : `<p class="sello borrador">Borrador · sin validez oficial</p>`;
  const ventana = window.open("", "_blank", "width=860,height=1000");
  if (!ventana) return false;
  ventana.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${escapar(detalle.codigo)} · ${escapar(nombreDoc(informe))}</title>
<style>
  @page { margin: 22mm 20mm; }
  body { font-family: "Source Sans 3", Arial, sans-serif; color: #172033; line-height: 1.5; max-width: 720px; margin: 0 auto; padding: 24px; }
  .membrete { margin: 0; color: #163b78; font-weight: 700; text-align: center; }
  .membrete + .membrete { font-weight: 600; font-size: 0.92rem; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 2px solid #163b78; }
  h2 { margin: 22px 0 8px; color: #163b78; font-size: 1.05rem; text-transform: uppercase; letter-spacing: 0.04em; }
  p { margin: 0 0 8px; }
  .dato { margin: 0 0 2px; }
  .item { padding-left: 14px; }
  .sello { margin-top: 28px; padding-top: 10px; border-top: 1px solid #ccd6e6; color: #4f7a18; font-weight: 700; }
  .sello.borrador { color: #b45309; }
</style></head><body>${cuerpo}${sello}</body></html>`);
  ventana.document.close();
  ventana.focus();
  window.setTimeout(() => ventana.print(), 300);
  return true;
}

export function InformeExpediente({ detalle, ocupado, setError, actuar }) {
  const productos = detalle.productos || [];
  const validaciones = detalle.validaciones || [];
  const informes = [...(detalle.informes || [])].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  const tecnicoEmitido = informes.some((i) => i.tipo === "INFORME_TECNICO" && i.estado === "EMITIDO");
  const actuales = ["INFORME_TECNICO", "OFICIO"]
    .map((tipo) => informes.filter((i) => i.tipo === tipo).at(-1))
    .filter(Boolean);
  const anteriores = informes.filter((i) => !actuales.includes(i));

  const [nuevo, setNuevo] = useState({ tipo: "INFORME_TECNICO", destinatario: "" });
  const [mostrarNuevo, setMostrarNuevo] = useState(false);

  useEffect(() => {
    setMostrarNuevo(informes.length === 0);
    setNuevo((previo) => ({ ...previo, tipo: tecnicoEmitido ? "OFICIO" : "INFORME_TECNICO" }));
  }, [detalle.id, informes.length, tecnicoEmitido]);

  function crear(evento) {
    evento.preventDefault();
    if (nuevo.destinatario.trim().length < 3) {
      setError("Escribe el destinatario del documento (mínimo 3 caracteres).");
      return;
    }
    actuar(() => solicitar(`/solicitudes/${detalle.id}/informes`, {
      method: "POST",
      cuerpo: { tipo: nuevo.tipo, destinatario: nuevo.destinatario.trim() },
    }), { mensajeExito: "Borrador generado con los precios confirmados y la estadística." });
  }

  return (
    <section className="etapa" aria-labelledby="informe-titulo">
      <header className="etapa__cabeza">
        <span className="etapa__icono"><Icono nombre="documento" /></span>
        <div>
          <h4 id="informe-titulo">Documento del expediente</h4>
          <p>
            El sistema arma el borrador con los precios confirmados y la estadística. Revísalo, corrígelo si hace falta
            y emítelo: una vez emitido queda fijo y se avisa a la entidad.
          </p>
        </div>
        <span className={`etapa__chip etapa__chip--${tecnicoEmitido ? "confirmado" : "pendiente"}`}>
          {tecnicoEmitido ? "Informe emitido" : "Sin emitir"}
        </span>
      </header>

      <div className="etapa__resumen-precios">
        <h5>Precios de referencia confirmados</h5>
        <ul>
          {productos.map((producto) => {
            const v = validaciones.find((item) => item.productoSolicitudId === producto.id && item.confirmada);
            return (
              <li key={producto.id} className={v ? "es-listo" : ""}>
                <span>{producto.nombre}</span>
                <b>{v ? `${moneda(v.precioAdoptado)} / ${v.unidadMedida}` : "Sin confirmar"}</b>
              </li>
            );
          })}
        </ul>
      </div>

      {actuales.map((informe) => (
        <Documento key={informe.id} informe={informe} detalle={detalle} ocupado={ocupado} setError={setError} actuar={actuar} />
      ))}

      {anteriores.length ? (
        <details className="etapa__versiones">
          <summary>Versiones anteriores ({anteriores.length})</summary>
          <ul>
            {anteriores.map((informe) => (
              <li key={informe.id}>
                <span>{nombreDoc(informe)}</span>
                <small>{informe.estado === "EMITIDO" ? `Emitido ${fecha(informe.emitidoEn)}` : `Borrador ${fecha(informe.createdAt)}`}</small>
                <button type="button" className="etapa__btn etapa__btn--mini" onClick={() => imprimir(informe, detalle)}>Ver</button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {mostrarNuevo ? (
        <form className="etapa__form etapa__form--nuevo" onSubmit={crear} noValidate>
          <h5>{informes.length ? "Nuevo documento" : "Generar el borrador"}</h5>
          <div className="etapa__opciones">
            {Object.entries(TIPOS).map(([id, titulo]) => {
              const bloqueado = id === "OFICIO" && !tecnicoEmitido;
              return (
                <label key={id} className={`etapa__opcion${nuevo.tipo === id ? " es-activo" : ""}${bloqueado ? " es-bloqueado" : ""}`}>
                  <input type="radio" name="tipo" value={id} checked={nuevo.tipo === id} disabled={bloqueado} onChange={() => setNuevo((previo) => ({ ...previo, tipo: id }))} />
                  <strong>{titulo}</strong>
                  <small>
                    {id === "INFORME_TECNICO"
                      ? "Precios confirmados, estadística y traslado."
                      : bloqueado ? "Disponible después de emitir el informe técnico." : "Carta de traslado del resultado."}
                  </small>
                </label>
              );
            })}
          </div>
          <label className="etapa__campo">
            <span>Destinatario *</span>
            <input
              value={nuevo.destinatario}
              onChange={(e) => setNuevo((previo) => ({ ...previo, destinatario: e.target.value }))}
              maxLength={240}
              placeholder={`Nombre y cargo${detalle.institucionSolicitante ? ` en ${detalle.institucionSolicitante}` : ""}`}
            />
          </label>
          <footer className="etapa__pie">
            {informes.length ? (
              <button type="button" className="etapa__btn etapa__btn--linea" onClick={() => setMostrarNuevo(false)}>Cancelar</button>
            ) : null}
            <button type="submit" className="etapa__btn etapa__btn--principal" disabled={ocupado}>
              <Icono nombre="documento" />
              Generar borrador
            </button>
          </footer>
        </form>
      ) : (
        <button type="button" className="etapa__btn etapa__btn--linea etapa__btn--centro" onClick={() => setMostrarNuevo(true)}>
          <Icono nombre="mas" />
          {tecnicoEmitido ? "Preparar un oficio o una versión nueva" : "Preparar otra versión"}
        </button>
      )}
    </section>
  );
}

function Documento({ informe, detalle, ocupado, setError, actuar }) {
  const borrador = informe.estado !== "EMITIDO";
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(informe.resumen || "");
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    setTexto(informe.resumen || "");
    setEditando(false);
    setConfirmando(false);
  }, [informe.id]);

  function guardarVersion() {
    if (!texto.trim()) {
      setError("El documento no puede quedar vacío.");
      return;
    }
    actuar(() => solicitar(`/solicitudes/${detalle.id}/informes`, {
      method: "POST",
      cuerpo: { tipo: informe.tipo, destinatario: informe.destinatario, resumen: texto.trim() },
    }), { mensajeExito: `Texto guardado como ${TIPOS[informe.tipo]} v${informe.version + 1}.` });
  }

  function emitir() {
    actuar(() => solicitar(`/solicitudes/${detalle.id}/informes/${informe.id}/emitir`, { method: "POST" }), {
      mensajeExito: `${nombreDoc(informe)} emitido. La entidad recibió el aviso.`,
    });
  }

  const estadisticas = informe.estadisticas?.productos || [];

  return (
    <article className={`etapa__documento${borrador ? "" : " es-emitido"}`}>
      <header className="etapa__documento-cabeza">
        <div>
          <strong>{nombreDoc(informe)}</strong>
          <small>
            Para {informe.destinatario}
            {informe.elaboradoPor?.nombre ? ` · elaborado por ${informe.elaboradoPor.nombre}` : ""}
          </small>
        </div>
        <span className={`etapa__chip etapa__chip--${borrador ? "borrador" : "confirmado"}`}>
          {borrador ? "Borrador" : `Emitido ${fecha(informe.emitidoEn)}`}
        </span>
      </header>

      {editando ? (
        <div className="etapa__editor">
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={16} maxLength={20000} aria-label="Texto del documento" />
          <small>{texto.length.toLocaleString("es-GT")}/20,000 · Al guardar se crea la versión {informe.version + 1}; la actual se conserva.</small>
        </div>
      ) : (
        <div className="etapa__papel">
          {bloques(informe.resumen).map((b, indice) => {
            if (b.tipo === "membrete") return <p key={indice} className="etapa__papel-membrete">{b.linea}</p>;
            if (b.tipo === "titulo") return <h6 key={indice}>{b.linea}</h6>;
            if (b.tipo === "item") return <p key={indice} className="etapa__papel-item">{b.linea}</p>;
            if (b.tipo === "dato") return <p key={indice} className="etapa__papel-dato"><b>{b.clave}:</b> {b.valor}</p>;
            return <p key={indice}>{b.linea}</p>;
          })}
          {!borrador ? <p className="etapa__papel-sello"><Icono nombre="sello" /> Documento emitido · copia fija</p> : null}
        </div>
      )}

      {!borrador && estadisticas.length ? (
        <table className="etapa__tabla">
          <caption>Estadística congelada al emitir</caption>
          <thead>
            <tr><th>Producto</th><th>Comparables</th><th>Media</th><th>Mediana</th><th>Moda</th></tr>
          </thead>
          <tbody>
            {estadisticas.map((m) => (
              <tr key={m.productoSolicitudId}>
                <td>{m.nombre}</td>
                <td>{m.incluidos?.length ?? 0}</td>
                <td>{moneda(m.media)}</td>
                <td>{moneda(m.mediana)}</td>
                <td>{m.moda ? moneda(m.moda) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      {confirmando ? (
        <div className="etapa__confirmar" role="alertdialog" aria-label="Confirmar emisión">
          <p>
            <b>¿Emitir {nombreDoc(informe)}?</b> El texto y la estadística quedan fijos, y la entidad recibe un aviso.
            Para cambiar algo después tendrás que emitir una versión nueva.
          </p>
          <div>
            <button type="button" className="etapa__btn etapa__btn--linea" onClick={() => setConfirmando(false)}>Revisar otra vez</button>
            <button type="button" className="etapa__btn etapa__btn--principal" disabled={ocupado} onClick={emitir}>
              <Icono nombre="sello" />
              Sí, emitir
            </button>
          </div>
        </div>
      ) : (
        <footer className="etapa__pie">
          <button
            type="button"
            className="etapa__btn etapa__btn--linea"
            onClick={() => { if (!imprimir(informe, detalle)) setError("El navegador bloqueó la ventana de impresión. Permite ventanas emergentes para este sitio."); }}
          >
            <Icono nombre="imprimir" />
            Imprimir o guardar PDF
          </button>
          {borrador && editando ? (
            <>
              <button type="button" className="etapa__btn etapa__btn--linea" onClick={() => { setEditando(false); setTexto(informe.resumen || ""); }}>Cancelar</button>
              <button type="button" className="etapa__btn etapa__btn--principal" disabled={ocupado || texto.trim() === (informe.resumen || "").trim()} onClick={guardarVersion}>
                Guardar como v{informe.version + 1}
              </button>
            </>
          ) : null}
          {borrador && !editando ? (
            <>
              <button type="button" className="etapa__btn etapa__btn--linea" onClick={() => setEditando(true)}>
                <Icono nombre="lapiz" />
                Editar texto
              </button>
              <button type="button" className="etapa__btn etapa__btn--principal" disabled={ocupado} onClick={() => setConfirmando(true)}>
                <Icono nombre="sello" />
                Emitir
              </button>
            </>
          ) : null}
        </footer>
      )}
    </article>
  );
}
