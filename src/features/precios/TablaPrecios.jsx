import { useState } from "react";
import { estaVigente, fechaRegistrada, formatearFecha, formatearQuetzales } from "../../data/precios";
import { DialogoProducto } from "./DialogoProducto";

export function TablaPrecios({ items }) {
  const [detalle, setDetalle] = useState(null);

  return (
    <>
      <div className="tabla-wrap">
        <table className="tabla">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Presentación</th>
              <th>Precio de referencia</th>
              <th>Publicación</th>
              <th>Vigencia hasta</th>
              <th>
                <span className="sr-only">Detalle</span>
              </th>
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
                <td>
                  <strong className="tabla__producto">{item.producto}</strong>
                </td>
                <td>{item.presentacion || "—"}</td>
                <td className="tabla__precio">{formatearQuetzales(item.precio)}</td>
                <td>{formatearFecha(item.fechaPublicacion)}</td>
                <td>
                  <span className={`chip ${claseVigencia(item.vigenciaHasta)}`}>
                    {formatearFecha(item.vigenciaHasta)}
                  </span>
                </td>
                <td className="tabla__accion">
                  <button type="button" className="btn btn--linea btn--chico" onClick={() => setDetalle(item)}>
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <DialogoProducto item={detalle} onCerrar={() => setDetalle(null)} />
    </>
  );
}

function claseVigencia(valor) {
  if (!fechaRegistrada(valor)) return "chip--neutro";
  return estaVigente(valor) ? "chip--ok" : "chip--aviso";
}
