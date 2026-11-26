import { useEffect, useState } from "react";
import { enviarArchivo, solicitar } from "../../servicios/api";
import { fechaCorta, pdfValido } from "./expedienteTrabajoUtil";
import "./entrega.css";

const MEDIOS = [
  {
    id: "DIGITAL",
    titulo: "Digital",
    texto: "Correo o portal",
    icono: "correo",
    ayuda: "Ej. Enviado por correo a compras@entidad.gob.gt; acuse de recibido del 25/11 a las 10:15.",
  },
  {
    id: "FISICA",
    titulo: "Física",
    texto: "Documento impreso",
    icono: "documento",
    ayuda: "Ej. Recibido en ventanilla por Ana López, cargo Jefa de Compras; oficio n.º 123-2026 sellado.",
  },
  {
    id: "CD",
    titulo: "CD",
    texto: "Disco con archivos",
    icono: "disco",
    ayuda: "Ej. CD con informe y anexos entregado a Ana López; conocimiento firmado n.º 45.",
  },
];

const TIPOS_INFORME = { INFORME_TECNICO: "Informe técnico" };

const TRAZOS = {
  enviar: "M21 3 10 14M21 3l-7 18-4-7-7-4 18-7z",
  correo: "M3 6h18v12H3V6zm0 0 9 7 9-7",
  documento: "M7 3h7l5 5v13H7V3zM14 3v5h5M10 13h6M10 17h6",
  disco: "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4z",
  subir: "M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3",
  pdf: "M7 3h7l5 5v13H7V3zM14 3v5h5",
  check: "M5 12.5l4.5 4.5L19 7.5",
  x: "M6 6l12 12M18 6 6 18",
};

function Icono({ nombre }) {
  return (
    <svg className="entrega__svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d={TRAZOS[nombre]} />
    </svg>
  );
}

function hoy() {
  const fecha = new Date();
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}

function fechaLarga(iso) {
  if (!iso) return "";
  const [anio, mes, dia] = String(iso).slice(0, 10).split("-").map(Number);
  return new Date(anio, mes - 1, dia).toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" });
}

function tamano(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function nombreInforme(informe) {
  return `${TIPOS_INFORME[informe.tipo] || informe.tipo} v${informe.version}`;
}

export function EntregaExpediente({ detalle, ocupado, setError, actuar }) {
  const emitidos = (detalle.informes || []).filter((informe) => informe.estado === "EMITIDO");
  const entregas = detalle.entregas || [];
  const [form, setForm] = useState({
    informeId: "",
    medio: "DIGITAL",
    destinatario: "",
    fechaEntrega: hoy(),
    constancia: "",
  });
  const [archivo, setArchivo] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [errores, setErrores] = useState({});

  useEffect(() => {
    setForm((previo) => ({ ...previo, informeId: emitidos.at(-1)?.id || "" }));
  }, [detalle.id, emitidos.length]);

  const medio = MEDIOS.find((item) => item.id === form.medio) || MEDIOS[0];
  const informeElegido = emitidos.find((informe) => informe.id === form.informeId);

  function cambiar(campo, valor) {
    setForm((previo) => ({ ...previo, [campo]: valor }));
    setErrores((previo) => ({ ...previo, [campo]: "" }));
  }

  function tomarArchivo(lista) {
    const elegido = lista?.[0];
    if (!elegido) return;
    if (!pdfValido(elegido)) {
      setError("La constancia tiene que ser un PDF de hasta 10 MB.");
      return;
    }
    setError("");
    setArchivo(elegido);
  }

  function registrar(evento) {
    evento.preventDefault();
    const fallos = {};
    if (form.destinatario.trim().length < 3) fallos.destinatario = "Escribe el nombre o cargo de quien recibe (mínimo 3 caracteres).";
    if (form.constancia.trim().length < 3) fallos.constancia = "Describe cómo consta la entrega (mínimo 3 caracteres).";
    if (!form.fechaEntrega) fallos.fechaEntrega = "Indica la fecha de entrega.";
    setErrores(fallos);
    if (Object.keys(fallos).length) return;

    const enviado = form;
    const adjunto = archivo;
    actuar(async () => {
      const actual = await solicitar(`/solicitudes/${detalle.id}/entregas`, {
        method: "POST",
        cuerpo: {
          medio: enviado.medio,
          destinatario: enviado.destinatario.trim(),
          fechaEntrega: enviado.fechaEntrega,
          constancia: enviado.constancia.trim(),
          ...(enviado.informeId ? { informeId: enviado.informeId } : {}),
        },
      });
      const registrada = (actual.entregas || []).at(-1);
      if (adjunto && registrada) {
        await enviarArchivo(`/solicitudes/${actual.id}/adjuntos`, adjunto, { entregaId: registrada.id });
      }
      setForm((previo) => ({ ...previo, destinatario: "", constancia: "", fechaEntrega: hoy() }));
      setArchivo(null);
      return actual;
    }, { mensajeExito: "Entrega registrada en el expediente." });
  }

  return (
    <section className="entrega" aria-labelledby="entrega-titulo">
      <header className="entrega__cabeza">
        <span className="entrega__icono"><Icono nombre="enviar" /></span>
        <div>
          <h4 id="entrega-titulo">Entrega al solicitante</h4>
          <p>Deja constancia de cómo, cuándo y a quién entregaste el informe. Con la entrega registrada puedes completar el expediente.</p>
        </div>
        <span className={`entrega__estado${entregas.length ? " es-listo" : ""}`}>
          {entregas.length ? <><Icono nombre="check" /> Entregado</> : "Pendiente"}
        </span>
      </header>

      {entregas.length > 0 ? (
        <ul className="entrega__lista">
          {[...entregas].reverse().map((item) => {
            const datos = MEDIOS.find((m) => m.id === item.medio);
            const informe = (detalle.informes || []).find((i) => i.id === item.informeId);
            return (
              <li key={item.id}>
                <span className="entrega__lista-icono"><Icono nombre={datos?.icono || "enviar"} /></span>
                <div>
                  <strong>{item.destinatario}</strong>
                  <span>
                    {datos?.titulo || item.medio} · {fechaLarga(item.fechaEntrega) || fechaCorta(item.fechaEntrega)}
                    {informe ? ` · ${nombreInforme(informe)}` : ""}
                  </span>
                  <p>{item.constancia}</p>
                  {item.registradaPor?.nombre ? <small>Registrada por {item.registradaPor.nombre}</small> : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      <form className="entrega__form" onSubmit={registrar} noValidate>
        <header className="entrega__form-cabeza">
          <h5>{entregas.length ? "Registrar otra entrega" : "Registrar entrega"}</h5>
          <span>Los campos con * son obligatorios</span>
        </header>

        <div className="entrega__campo">
          <span>Informe que se entrega</span>
          {emitidos.length === 0 ? (
            <p className="entrega__aviso">No hay un informe emitido. Puedes registrar la entrega igual, pero conviene emitirlo primero.</p>
          ) : emitidos.length === 1 ? (
            <div className="entrega__informe">
              <span className="entrega__informe-icono"><Icono nombre="pdf" /></span>
              <div>
                <strong>{nombreInforme(emitidos[0])}</strong>
                <small>Emitido{emitidos[0].destinatario ? ` · para ${emitidos[0].destinatario}` : ""}</small>
              </div>
            </div>
          ) : (
            <select value={form.informeId} onChange={(e) => cambiar("informeId", e.target.value)}>
              {emitidos.map((informe) => (
                <option key={informe.id} value={informe.id}>{nombreInforme(informe)}</option>
              ))}
            </select>
          )}
        </div>

        <fieldset className="entrega__medios">
          <legend>Medio de entrega *</legend>
          <div>
            {MEDIOS.map((item) => (
              <label key={item.id} className={`entrega__medio${form.medio === item.id ? " es-activo" : ""}`}>
                <input type="radio" name="medio" value={item.id} checked={form.medio === item.id} onChange={() => cambiar("medio", item.id)} />
                <span className="entrega__medio-icono"><Icono nombre={item.icono} /></span>
                <strong>{item.titulo}</strong>
                <small>{item.texto}</small>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="entrega__grilla">
          <label className={`entrega__campo${errores.destinatario ? " es-error" : ""}`}>
            <span>Recibe *</span>
            <input
              value={form.destinatario}
              onChange={(e) => cambiar("destinatario", e.target.value)}
              maxLength={240}
              placeholder={detalle.institucionSolicitante ? `Nombre y cargo en ${detalle.institucionSolicitante}` : "Nombre y cargo"}
              aria-invalid={Boolean(errores.destinatario)}
            />
            {errores.destinatario ? <small role="alert">{errores.destinatario}</small> : null}
          </label>
          <label className={`entrega__campo${errores.fechaEntrega ? " es-error" : ""}`}>
            <span>Fecha de entrega *</span>
            <input type="date" value={form.fechaEntrega} max={hoy()} onChange={(e) => cambiar("fechaEntrega", e.target.value)} />
            {errores.fechaEntrega ? <small role="alert">{errores.fechaEntrega}</small> : null}
          </label>
          <label className={`entrega__campo entrega__campo--ancho${errores.constancia ? " es-error" : ""}`}>
            <span className="entrega__etiqueta-fila">
              Constancia *
              <em>{form.constancia.length}/1000</em>
            </span>
            <textarea
              value={form.constancia}
              onChange={(e) => cambiar("constancia", e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder={medio.ayuda}
              aria-invalid={Boolean(errores.constancia)}
            />
            {errores.constancia ? <small role="alert">{errores.constancia}</small> : <small>Describe la prueba de entrega: acuse, sello, firma o número de oficio.</small>}
          </label>

          <div className="entrega__campo entrega__campo--ancho">
            <span>Constancia en PDF</span>
            {archivo ? (
              <div className="entrega__archivo">
                <span className="entrega__informe-icono"><Icono nombre="pdf" /></span>
                <div>
                  <strong>{archivo.name}</strong>
                  <small>{tamano(archivo.size)}</small>
                </div>
                <button type="button" className="entrega__quitar" onClick={() => setArchivo(null)} aria-label="Quitar archivo">
                  <Icono nombre="x" />
                </button>
              </div>
            ) : (
              <label
                className={`entrega__zona${arrastrando ? " es-arrastrando" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
                onDragLeave={() => setArrastrando(false)}
                onDrop={(e) => { e.preventDefault(); setArrastrando(false); tomarArchivo(e.dataTransfer.files); }}
              >
                <input type="file" accept="application/pdf,.pdf" onChange={(e) => { tomarArchivo(e.target.files); e.target.value = ""; }} />
                <span className="entrega__zona-icono"><Icono nombre="subir" /></span>
                <strong>Arrastra el PDF aquí o haz clic para elegirlo</strong>
                <small>Acuse, oficio sellado o conocimiento firmado · opcional · hasta 10 MB</small>
              </label>
            )}
          </div>
        </div>

        <footer className="entrega__pie">
          <p>
            {form.destinatario.trim()
              ? <>Entrega <b>{medio.titulo.toLowerCase()}</b>{informeElegido ? <> del <b>{nombreInforme(informeElegido)}</b></> : null} a <b>{form.destinatario.trim()}</b> el {fechaLarga(form.fechaEntrega)}.</>
              : "Indica quién recibe para registrar la entrega."}
          </p>
          <button type="submit" className="entrega__boton" disabled={ocupado}>
            <Icono nombre="enviar" />
            {ocupado ? "Registrando…" : "Registrar entrega"}
          </button>
        </footer>
      </form>
    </section>
  );
}
