import { formatearQuetzales } from "../../data/precios";

export function TablaPrecios({ items }) {
  return (
    <div className="tabla-wrap">
      <table className="tabla">
        <thead>
          <tr>
            <th>Bien o servicio</th>
            <th>Especificación</th>
            <th>Unidad</th>
            <th>Precio</th>
            <th>Método</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={6}>No hay renglones que coincidan con la búsqueda.</td>
            </tr>
          )}
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.bien}</td>
              <td>{item.especificacion}</td>
              <td>{item.unidad}</td>
              <td>{formatearQuetzales(item.precio)}</td>
              <td>{item.metodo}</td>
              <td>
                <span className={`chip ${item.estado === "publicado" ? "chip--ok" : "chip--aviso"}`}>
                  {item.estado === "publicado" ? "Publicado" : "En revisión"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
