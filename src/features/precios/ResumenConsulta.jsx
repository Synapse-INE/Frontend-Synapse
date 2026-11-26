export function ResumenConsulta({ indicadores }) {
  if (!indicadores?.length) return null;

  return (
    <div className="h-bars h-bars--indicadores" aria-label="Resumen de la consulta">
      {indicadores.map((item) => (
        <article className="h-row h-row--estatico" key={item.id}>
          <span>{item.etiqueta}</span>
          <strong>{item.valor}</strong>
          <div className="track">
            <i style={{ "--p": `${item.barra}%` }} />
          </div>
        </article>
      ))}
    </div>
  );
}
