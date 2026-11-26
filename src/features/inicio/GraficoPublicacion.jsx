import { Etiqueta } from "../../components/ui/Etiqueta";

function trazoDe(puntos) {
  if (!puntos.length) return "";
  if (puntos.length === 1) {
    const p = puntos[0];
    return `M${p.x} ${p.y} L${Math.min(p.x + 48, 368)} ${p.y}`;
  }
  return puntos.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ");
}

export function GraficoPublicacion({ resumen }) {
  const puntos = resumen?.puntos || [];
  const total = resumen?.total || 0;
  const pico = puntos.reduce((mejor, punto) => (Number(punto.n) > Number(mejor?.n || 0) ? punto : mejor), null);
  const publicados = puntos.reduce((suma, punto) => suma + Number(punto.n || 0), 0);
  const trazo = trazoDe(puntos);
  const area = puntos.length
    ? `${trazo} L ${puntos.at(-1).x} 188 L ${puntos[0].x} 188 Z`
    : "";

  return (
    <article className="panel panel--linea revelar">
      <div className="panel__cab">
        <div>
          <Etiqueta>Publicación</Etiqueta>
          <h2>Renglones por mes</h2>
          <p>{total ? `${publicados.toLocaleString("es-GT")} renglones en los últimos doce meses.` : "Sin renglones publicados."}</p>
        </div>
        <div className="dato-grande dato-grande--naranja">
          <span>Pico</span>
          <strong>{pico?.n ? Number(pico.n).toLocaleString("es-GT") : "0"}</strong>
        </div>
      </div>
      <div className="panel__graf panel__graf--linea">
        {puntos.length ? (
          <svg
            className="linea"
            viewBox="0 0 400 200"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Renglones publicados en los últimos doce meses."
          >
            <defs>
              <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2153A1" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#2153A1" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <text className="linea__eje" x="22" y="30">{pico?.n ? pico.n : ""}</text>
            <line className="grid" x1="20" y1="36" x2="388" y2="36" />
            <line className="grid" x1="20" y1="78" x2="388" y2="78" />
            <line className="grid" x1="20" y1="102" x2="388" y2="102" />
            <line className="grid" x1="20" y1="138" x2="388" y2="138" />
            <line className="grid" x1="20" y1="168" x2="388" y2="168" />
            <path className="area" d={area} fill="url(#area)" />
            <path className="trazo" d={trazo} />
            {puntos.map((punto) => (
              <circle key={punto.mes} className={punto.n ? "es-dato" : "es-vacio"} cx={punto.x} cy={punto.y} r={punto.n ? 6 : 3.2} />
            ))}
            {puntos.map((punto) => punto.n ? (
              <text key={`n-${punto.mes}`} className="linea__valor" x={punto.x} y={punto.y - 12} textAnchor="middle">
                {punto.n}
              </text>
            ) : null)}
            {puntos.map((punto) => (
              <text key={`t-${punto.mes}`} x={punto.x} y="196" textAnchor="middle">
                {punto.mes}
              </text>
            ))}
          </svg>
        ) : (
          <p className="panel__vacio">{resumen?.cargando ? "Cargando la publicación…" : "Sin datos para graficar."}</p>
        )}
      </div>
    </article>
  );
}
