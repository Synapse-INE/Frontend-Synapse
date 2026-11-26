import { solicitar } from "../../servicios/api";

export async function listarMisProductos() {
  return solicitar("/proveedores/yo/productos");
}

export async function crearProductoProveedor(datos) {
  return solicitar("/proveedores/yo/productos", {
    method: "POST",
    cuerpo: datos,
  });
}

export async function actualizarProductoProveedor(id, datos) {
  return solicitar(`/proveedores/yo/productos/${id}`, {
    method: "PATCH",
    cuerpo: datos,
  });
}

export async function confirmarPrecioProveedor(id) {
  return solicitar(`/proveedores/yo/productos/${id}/confirmar-precio`, {
    method: "POST",
  });
}