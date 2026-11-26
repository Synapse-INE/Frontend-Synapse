import { useCallback, useEffect, useMemo, useState } from "react";
import { confirmarPrecio, enviarCotizacion, listarSolicitudesProveedor } from "../../servicios/portal";
import { Aviso, useAviso } from "./Aviso";
import { PASOS_PROVEEDOR } from "./datos";
import { fechaCorta, fechaDia } from "./formato";
import { BotonPrimario } from "./login/BotonPrimario";
import { CampoTexto } from "./login/CampoTexto";
import { Modal } from "./Modal";
import { hace, plazoDe } from "./plazos";
import { useSesion } from "./sesion";
import { Stepper } from "./Stepper";

const moneda = new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ", minimumFractionDigits: 2 });

// Cómo se llama cada situación para el proveedor, y de qué tono es su etiqueta.
function situacion(s) {
  if (s.accion === "cotizar") return { texto: "Te toca cotizar", tono: "media", grupo: "accion" };
  if (s.accion === "confirmar") return { texto: "Falta tu confirmación", tono: "media", grupo: "accion" };
  if (s.paso === 1) return { texto: "Cotización enviada", tono: "neutra", grupo: "proceso" };
  if (s.paso === 2) return { texto: "En revisión del INE", tono: "neutra", grupo: "proceso" };
  return { texto: "Precio confirmado", tono: "ok", grupo: "cerrada" };
}

function unidad(s) {
  return s.propuesta?.unidad ?? "unidad";
}

function queSigue(s) {
  if (s.accion === "cotizar") return `Envía tu precio unitario y el plazo de entrega${s.limite ? ` antes del ${fechaCorta(s.limite)}` : ""}.`;
  if (s.accion === "confirmar") return `El INE propuso ${moneda.format(s.propuesta?.precio ?? 0)} por ${unidad(s)}. Confírmalo para cerrar el proceso.`;
  if (s.paso === 1) return "Tu cotización ya llegó al INE. Esperando a que revisen las ofertas; no tienes nada pendiente.";
  if (s.paso === 2) return "El INE está analizando las ofertas. No tienes nada pendiente.";
  return "Proceso terminado. Tu precio ya está registrado.";
}

function Progreso({ paso }) {
  const ultimo = PASOS_PROVEEDOR.length - 1;
  const completo = paso >= ultimo;
  const etiqueta = completo ? "Proceso completo" : `Paso ${paso + 1} de ${PASOS_PROVEEDOR.length}: ${PASOS_PROVEEDOR[paso].titulo}`;
  return (
    <div className="avance">
      <span className="avance__barra" role="img" aria-label={etiqueta}>
        {PASOS_PROVEEDOR.map((p, i) => (
          <span key={p.id} className={`avance__seg${i < paso || completo ? " avance__seg--hecho" : i === paso ? " avance__seg--actual" : ""}`} />
        ))}
      </span>
      <span className="avance__txt" aria-hidden="true">
        {completo ? "Completo" : `Paso ${paso + 1} de ${PASOS_PROVEEDOR.length}`}
      </span>
    </div>
  );
}

function Fila({ s, onAccion }) {
  const [abierta, setAbierta] = useState(false);
  const sit = situacion(s);
  const plazo = s.accion === "cotizar" ? plazoDe(s.limite) : null;
  const idPanel = `historial-${s.id}`;
  return (
    <li id={`fila-${s.id}`} className={`fila${s.accion ? " fila--accion" : ""}`}>
      <div className="fila__marcas">
        <span className={`pill pill--${sit.tono}`}>{sit.texto}</span>
        {plazo && <span className={`pill pill--${plazo.tono}`}>{plazo.texto} · {fechaDia(s.limite)}</span>}
      </div>

      <div className="fila__cab">
        <h3>{s.titulo}</h3>
        <p className="fila__meta">
          {s.numero} · {s.modalidad} · Recibida {hace(s.fecha)}
        </p>
      </div>

      <Progreso paso={s.paso} />

      <div className={`siguiente${s.accion ? " siguiente--accion" : ""}`}>
        <p>{queSigue(s)}</p>
        {s.accion === "cotizar" && (
          <button type="button" className="pb" onClick={() => onAccion({ tipo: "cotizar", s })}>
            Enviar cotización
          </button>
        )}
        {s.accion === "confirmar" && (
          <button type="button" className="pb" onClick={() => onAccion({ tipo: "confirmar", s })}>
            Confirmar precio
          </button>
        )}
      </div>

      <button type="button" className="enlace-boton fila__mas" aria-expanded={abierta} aria-controls={idPanel} onClick={() => setAbierta((v) => !v)}>
        {abierta ? "Ocultar historial" : "Ver historial"}
      </button>

      {abierta && (
        <div className="fila__detalle" id={idPanel}>
          <Stepper pasos={PASOS_PROVEEDOR} actual={s.paso} fechas={s.historial.map((h) => h.fecha)} />
          {s.oferta && (
            <p className="fila__oferta">
              Tu oferta: <strong>{moneda.format(s.oferta.precio)}</strong> por {unidad(s)} · entrega en {s.oferta.plazoDias} {s.oferta.plazoDias === 1 ? "día" : "días"}
            </p>
          )}
          <ol className="historial">
            {s.historial.map((h) => (
              <li key={h.paso}>
                <time dateTime={h.fecha}>{fechaCorta(h.fecha)}</time>
                <span>
                  <strong>{PASOS_PROVEEDOR[h.paso].titulo}</strong> {PASOS_PROVEEDOR[h.paso].detalle}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </li>
  );
}

function numero(texto) {
  const n = Number(String(texto).trim().replace(/,/g, ""));
  return Number.isFinite(n) ? n : NaN;
}

// Formulario común: pide confirmación al servidor y muestra "enviando" → "listo" antes de cerrar.
function useEnvio(ejecutar, alTerminar) {
  const [estado, setEstado] = useState("reposo");
  const [fallo, setFallo] = useState("");
  async function enviar() {
    setEstado("cargando");
    setFallo("");
    try {
      await ejecutar();
      setEstado("exito");
      window.setTimeout(alTerminar, 700);
    } catch {
      setEstado("reposo");
      setFallo("No pudimos enviarlo. Intenta de nuevo.");
    }
  }
  return { estado, fallo, enviar };
}

function DialogoCotizar({ s, proveedorId, onCerrar, onListo }) {
  const [precio, setPrecio] = useState("");
  const [plazo, setPlazo] = useState("");
  const [errores, setErrores] = useState({});
  const { estado, fallo, enviar } = useEnvio(
    () => enviarCotizacion({ solicitudId: s.id, proveedorId, precio: numero(precio), plazoDias: numero(plazo) }),
    onListo
  );

  function validar(e) {
    e.preventDefault();
    const p = numero(precio);
    const d = numero(plazo);
    const nuevos = {};
    if (!precio.trim()) nuevos.precio = "Escribe el precio por unidad.";
    else if (!(p > 0) || p > 10_000_000) nuevos.precio = "Escribe un precio mayor que cero, por ejemplo 125.50.";
    if (!plazo.trim()) nuevos.plazo = "Escribe en cuántos días puedes entregar.";
    else if (!Number.isInteger(d) || d < 1 || d > 365) nuevos.plazo = "Escribe un número entero de días, entre 1 y 365.";
    setErrores(nuevos);
    if (Object.keys(nuevos).length) {
      document.querySelector(nuevos.precio ? "[name=precio]" : "[name=plazo]")?.focus();
      return;
    }
    enviar();
  }

  return (
    <Modal titulo="Enviar cotización" subtitulo={`${s.numero} · ${s.titulo}`} onCerrar={onCerrar}>
      <form className="modal__form" onSubmit={validar} noValidate>
        <p className="modal__texto">El INE verá tu oferta apenas la envíes. Después de enviarla no podrás cambiarla desde aquí.</p>
        <CampoTexto
          etiqueta="Precio por unidad (Q)"
          name="precio"
          inputMode="decimal"
          autoComplete="off"
          value={precio}
          error={errores.precio}
          valido={!!precio && !errores.precio && numero(precio) > 0}
          onChange={(e) => setPrecio(e.target.value)}
        />
        <CampoTexto
          etiqueta="Plazo de entrega (días)"
          name="plazo"
          inputMode="numeric"
          autoComplete="off"
          value={plazo}
          error={errores.plazo}
          valido={!!plazo && !errores.plazo && Number.isInteger(numero(plazo)) && numero(plazo) > 0}
          onChange={(e) => setPlazo(e.target.value)}
        />
        {fallo && <p role="alert" className="modal__fallo">{fallo}</p>}
        <div className="modal__acciones">
          <button type="button" className="pb pb--sec" onClick={onCerrar} disabled={estado !== "reposo"}>
            Cancelar
          </button>
          <BotonPrimario estado={estado} textoCarga="Enviando" textoExito="Enviada" className="pb-envio">
            Enviar cotización
          </BotonPrimario>
        </div>
      </form>
    </Modal>
  );
}

function DialogoConfirmar({ s, proveedorId, onCerrar, onListo }) {
  const { estado, fallo, enviar } = useEnvio(() => confirmarPrecio({ solicitudId: s.id, proveedorId }), onListo);
  return (
    <Modal titulo="Confirmar precio" subtitulo={`${s.numero} · ${s.titulo}`} onCerrar={onCerrar}>
      <form
        className="modal__form"
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
      >
        <p className="modal__precio">
          <span>El INE propone</span>
          <strong>{moneda.format(s.propuesta?.precio ?? 0)}</strong>
          <span>por {unidad(s)}</span>
        </p>
        <p className="modal__texto">Al confirmar, este precio queda registrado como tu precio de referencia y el proceso se cierra.</p>
        {fallo && <p role="alert" className="modal__fallo">{fallo}</p>}
        <div className="modal__acciones">
          <button type="button" className="pb pb--sec" onClick={onCerrar} disabled={estado !== "reposo"}>
            Ahora no
          </button>
          <BotonPrimario estado={estado} textoCarga="Confirmando" textoExito="Confirmado" className="pb-envio">
            Confirmar precio
          </BotonPrimario>
        </div>
      </form>
    </Modal>
  );
}

const GRUPOS = [
  { id: "accion", titulo: "Te toca a ti", vacio: "Nada pendiente" },
  { id: "proceso", titulo: "En proceso", vacio: "Sin procesos abiertos" },
  { id: "cerrada", titulo: "Cerradas", vacio: "Aún sin precios confirmados" },
];

export function InicioProveedorPage() {
  const { usuario } = useSesion();
  const [solicitudes, setSolicitudes] = useState(null);
  const [error, setError] = useState(false);
  const [grupo, setGrupo] = useState("");
  const [dialogo, setDialogo] = useState(null);
  const [aviso, mostrarAviso] = useAviso();

  const cargar = useCallback(
    () => listarSolicitudesProveedor(usuario.proveedorId).then(setSolicitudes).catch(() => setError(true)),
    [usuario.proveedorId]
  );

  useEffect(() => {
    let vigente = true;
    listarSolicitudesProveedor(usuario.proveedorId)
      .then((datos) => vigente && setSolicitudes(datos))
      .catch(() => vigente && setError(true));
    return () => {
      vigente = false;
    };
  }, [usuario.proveedorId]);

  const lista = useMemo(() => solicitudes ?? [], [solicitudes]);
  const cuentas = useMemo(() => {
    const c = { accion: 0, proceso: 0, cerrada: 0 };
    lista.forEach((s) => {
      c[situacion(s).grupo] += 1;
    });
    return c;
  }, [lista]);

  const subtitulos = useMemo(() => {
    const cierres = lista.filter((s) => s.accion === "cotizar" && s.limite).map((s) => plazoDe(s.limite)).filter(Boolean);
    const urgente = cierres.sort((a, b) => a.dias - b.dias)[0];
    return {
      accion: cuentas.accion ? (urgente ? `${urgente.texto.replace("Cierra", "Lo más próximo cierra")}` : "Revisa cada solicitud") : "Estás al día",
      proceso: cuentas.proceso ? "El INE las está revisando" : "Sin procesos abiertos",
      cerrada: cuentas.cerrada ? "Precio registrado" : "Aún sin precios confirmados",
    };
  }, [lista, cuentas]);

  const visibles = useMemo(
    () =>
      lista
        .filter((s) => !grupo || situacion(s).grupo === grupo)
        .sort((a, b) => Number(!!b.accion) - Number(!!a.accion) || b.fecha.localeCompare(a.fecha)),
    [lista, grupo]
  );

  function terminado(mensaje) {
    setDialogo(null);
    cargar();
    mostrarAviso(mensaje);
  }

  return (
    <section className="portal">
      <header className="banda">
        <div className="contenedor banda__in banda__in--angosto">
          <div>
            <h1>Mis solicitudes</h1>
            <p>{usuario.nombre}</p>
          </div>
        </div>
      </header>

      <div className="contenedor portal__cuerpo portal__cuerpo--angosto">
        {error && (
          <p role="alert" className="formulario__error formulario__error--general">
            No pudimos cargar tus solicitudes. Intenta de nuevo más tarde.
          </p>
        )}
        {!solicitudes && !error && (
          <p className="portal__estado" role="status">
            Cargando tus solicitudes…
          </p>
        )}

        {solicitudes && (
          <>
            <div className="resumen resumen--tres" role="group" aria-label="Tus solicitudes por situación. Selecciona una para filtrar">
              {GRUPOS.map((g) => (
                <button key={g.id} type="button" className={`res res--${g.id}`} aria-pressed={grupo === g.id} onClick={() => setGrupo(grupo === g.id ? "" : g.id)}>
                  <span className="res__etq">{g.titulo}</span>
                  <span className="res__num">{cuentas[g.id]}</span>
                  <span className="res__sub">{subtitulos[g.id]}</span>
                </button>
              ))}
            </div>

            {lista.length === 0 ? (
              <p className="portal__vacio">Todavía no te han invitado a ninguna solicitud. Cuando el INE te invite, aparecerá aquí.</p>
            ) : (
              <ul className="bitacora" aria-label="Tus solicitudes">
                {visibles.map((s) => (
                  <Fila key={s.id} s={s} onAccion={setDialogo} />
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {dialogo?.tipo === "cotizar" && (
        <DialogoCotizar s={dialogo.s} proveedorId={usuario.proveedorId} onCerrar={() => setDialogo(null)} onListo={() => terminado("Cotización enviada. El INE ya puede verla.")} />
      )}
      {dialogo?.tipo === "confirmar" && (
        <DialogoConfirmar s={dialogo.s} proveedorId={usuario.proveedorId} onCerrar={() => setDialogo(null)} onListo={() => terminado("Precio confirmado. Quedó registrado.")} />
      )}
      <Aviso texto={aviso} />
    </section>
  );
}
