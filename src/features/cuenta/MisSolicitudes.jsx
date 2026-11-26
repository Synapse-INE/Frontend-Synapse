import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { formatearFecha } from "../../data/precios";
import { MarcaAtencion } from "../solicitud/Atencion";
import "./cuentaSolicitudes.css";

const MODALIDAD = {
  CONTRATO_ABIERTO: "Contrato abierto",
  SUBASTA_ELECTRONICA_INVERSA: "Subasta electrónica inversa",
  BIENES_SUMINISTROS_IMPORTADOS: "Bienes y suministros importados",
};

const CORTES = [
  { id: "todas", titulo: "Todas" },
  { id: "activas", titulo: "En trámite" },
  { id: "pendientes", titulo: "Pendientes" },
  { id: "cerradas", titulo: "Cerradas" },
];

const CERRADAS = new Set(["COMPLETADA", "RECHAZADA", "CANCELADA"]);
const PENDIENTES = new Set(["PENDIENTE_SUBSANACION", "BORRADOR"]);

function claseEstado(estado) {
  if (estado === "COMPLETADA") return "chip chip--ok";
  if (["RECHAZADA", "CANCELADA"].includes(estado)) return "chip chip--aviso";
  if (estado === "PENDIENTE_SUBSANACION") return "chip chip--aviso";
  if (estado === "BORRADOR") return "chip chip--neutro";
  return "chip";
}

function fechaSolicitud(item) {
  const crudo = item.enviadaEn || item.createdAt;
  if (!crudo) return "—";
  const texto = typeof crudo === "string" ? crudo.slice(0, 10) : crudo;
  return formatearFecha(texto);
}

function coincideCorte(estado, corte) {
  if (corte === "todas") return true;
  if (corte === "activas") return !CERRADAS.has(estado) && estado !== "BORRADOR";
  if (corte === "pendientes") return PENDIENTES.has(estado);
  if (corte === "cerradas") return CERRADAS.has(estado);
  return true;
}

export function MisSolicitudes({
  filas = [],
  estadosEtiqueta = {},
  vacioSinDatos = "Aún no hay solicitudes de esta cuenta.",
  vacioFiltrado = "Ninguna solicitud coincide con la búsqueda o el filtro.",
  nuevaRuta = "/solicitud",
  nuevaEtiqueta = "Nueva solicitud",
  onAbrir,
}) {
  const [corte, setCorte] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");

  const resumen = useMemo(() => {
    const conteo = { todas: filas.length, activas: 0, pendientes: 0, cerradas: 0 };
    const base = filas.length || 1;
    for (const item of filas) {
      if (!CERRADAS.has(item.estado) && item.estado !== "BORRADOR") conteo.activas += 1;
      if (PENDIENTES.has(item.estado)) conteo.pendientes += 1;
      if (CERRADAS.has(item.estado)) conteo.cerradas += 1;
    }
    return { conteo, base };
  }, [filas]);

  const estadosDisponibles = useMemo(() => {
    const set = new Set(filas.map((item) => item.estado).filter(Boolean));
    return [...set].sort((a, b) =>
      (estadosEtiqueta[a] || a).localeCompare(estadosEtiqueta[b] || b, "es"),
    );
  }, [filas, estadosEtiqueta]);

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return filas.filter((item) => {
      if (!coincideCorte(item.estado, corte)) return false;
      if (estado && item.estado !== estado) return false;
      if (!texto) return true;
      const bolsa = [
        item.codigo,
        item.titulo,
        item.institucionSolicitante,
        MODALIDAD[item.modalidad],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return bolsa.includes(texto);
    });
  }, [filas, corte, busqueda, estado]);

  const sinDatos = filas.length === 0;

  return (
    <div className="mesa solicitudes-mesa revelar es-visible">
      <div id="cuenta-resumen" className="mesa-resumen mesa-resumen--4" role="tablist" aria-label="Filtrar por estado general">
        {CORTES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={corte === item.id}
            className={corte === item.id ? "es-activa" : ""}
            onClick={() => setCorte(item.id)}
          >
            <strong>{resumen.conteo[item.id]}</strong>
            <span>{item.titulo}</span>
            <div className="track" aria-hidden="true">
              <i style={{ "--p": `${Math.round((resumen.conteo[item.id] / resumen.base) * 100)}%` }} />
            </div>
          </button>
        ))}
      </div>

      <div id="cuenta-herramientas" className="mesa-herramientas mesa-herramientas--solicitudes">
        <label>
          <span>Buscar</span>
          <input
            type="search"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Código, asunto o institución"
          />
        </label>
        <label>
          <span>Estado</span>
          <select value={estado} onChange={(evento) => setEstado(evento.target.value)}>
            <option value="">Todos</option>
            {estadosDisponibles.map((clave) => (
              <option key={clave} value={clave}>
                {estadosEtiqueta[clave] || clave} ({filas.filter((f) => f.estado === clave).length})
              </option>
            ))}
          </select>
        </label>
        {!sinDatos ? (
          <p className="solicitudes-mesa__conteo">
            Mostrando {visibles.length} de {filas.length}
          </p>
        ) : null}
      </div>

      {sinDatos ? (
        <div className="solicitudes-mesa__vacio">
          <h3>Sin solicitudes todavía</h3>
          <p>{vacioSinDatos}</p>
          <Link className="btn btn--naranja" to={nuevaRuta}>
            {nuevaEtiqueta}
          </Link>
        </div>
      ) : visibles.length === 0 ? (
        <div className="solicitudes-mesa__vacio">
          <h3>Sin coincidencias</h3>
          <p>{vacioFiltrado}</p>
          <button
            type="button"
            className="btn btn--linea"
            onClick={() => {
              setBusqueda("");
              setEstado("");
              setCorte("todas");
            }}
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div id="cuenta-lista" className="solicitudes-mesa__lista">
          {visibles.map((item) => (
            <button
              key={item.id}
              type="button"
              className="solicitud-fila"
              onClick={() => onAbrir(item.id)}
            >
              <div className="solicitud-fila__top">
                <span className="solicitud-fila__codigo">{item.codigo || "Sin código"}</span>
                <span className={claseEstado(item.estado)}>
                  {estadosEtiqueta[item.estado] || item.estado}
                </span>
                <span className="solicitud-fila__fecha">{fechaSolicitud(item)}</span>
              </div>
              <p className="solicitud-fila__asunto">{item.titulo || "Solicitud sin título"}</p>
              <div className="solicitud-fila__pie">
                {item.modalidad ? (
                  <span className="solicitud-fila__chip">{MODALIDAD[item.modalidad] || item.modalidad}</span>
                ) : null}
                <span className="solicitud-fila__chip solicitud-fila__chip--muted">
                  {item._count?.productos ?? 0} producto{item._count?.productos === 1 ? "" : "s"}
                </span>
                {item.institucionSolicitante ? (
                  <span className="solicitud-fila__chip solicitud-fila__chip--muted">
                    {item.institucionSolicitante}
                  </span>
                ) : null}
              </div>
              <MarcaAtencion atencion={item.atencion} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}