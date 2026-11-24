import { Etiqueta } from "../../components/ui/Etiqueta";

const PUNTOS = [
  { mes: "Jul", x: 28, y: 168 },
  { mes: "Ago", x: 110, y: 138 },
  { mes: "Sep", x: 192, y: 102 },
  { mes: "Oct", x: 274, y: 78 },
  { mes: "Nov", x: 368, y: 36 },
];

const TRAZO =
  "M28 168 C 70 160, 88 148, 110 138 S 160 116, 192 102 S 240 88, 274 78 S 330 48, 368 36";
const AREA = `${TRAZO} L 368 188 L 28 188 Z`;

export function GraficoPublicacion() {
  return (
    <article className="panel panel--linea revelar">
      <div className="panel__cab">
        <div>
          <Etiqueta>Publicación</Etiqueta>
          <h2>Renglones por mes</h2>
          <p>La DPIR publica precios de referencia cada mes en ine.gob.gt y GC.</p>
        </div>
        <div className="dato-grande dato-grande--naranja">
          <span>Noviembre</span>
          <strong>↑ alza</strong>
        </div>
      </div>
      <div className="panel__graf panel__graf--linea">
        <svg
          className="linea"
          viewBox="0 0 400 200"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Volumen ilustrativo de renglones publicados de julio a noviembre."
        >
          <defs>
            <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2153A1" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#2153A1" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <line className="grid" x1="20" y1="36" x2="388" y2="36" />
          <line className="grid" x1="20" y1="78" x2="388" y2="78" />
          <line className="grid" x1="20" y1="102" x2="388" y2="102" />
          <line className="grid" x1="20" y1="138" x2="388" y2="138" />
          <line className="grid" x1="20" y1="168" x2="388" y2="168" />
          <path className="area" d={AREA} fill="url(#area)" />
          <path className="trazo" d={TRAZO} />
          {PUNTOS.map((punto) => (
            <circle key={punto.mes} cx={punto.x} cy={punto.y} r="6.5" />
          ))}
          {PUNTOS.map((punto) => (
            <text key={`t-${punto.mes}`} x={punto.x} y="192" textAnchor="middle">
              {punto.mes}
            </text>
          ))}
        </svg>
      </div>
    </article>
  );
}
