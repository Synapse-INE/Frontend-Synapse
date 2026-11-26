// Servicio del portal (login y seguimiento de solicitudes).
// Hoy responde con datos de ejemplo de features/portal/datos.js. Cuando el backend esté listo,
// se reemplaza el cuerpo de estas funciones por llamadas reales; las pantallas no cambian.
import { CUENTAS, SOLICITUDES } from "../features/portal/datos";
import { fechaHoyIso } from "../features/portal/plazos";

const ESPERA_MS = 350; // simula la red para ver los estados de carga

function esperar(valor) {
  return new Promise((resolver) => setTimeout(() => resolver(valor), ESPERA_MS));
}

const DIAS_ENTRE_PASOS = [0, 2, 4, 6]; // fechas de ejemplo para el historial

function sumarDias(iso, dias) {
  const fecha = new Date(`${iso}T12:00:00`);
  fecha.setDate(fecha.getDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

function sinClave({ clave, ...usuario }) {
  void clave;
  return usuario;
}

export async function iniciarSesion({ correo, clave }) {
  const cuenta = CUENTAS.find((c) => c.correo === String(correo).trim().toLowerCase() && c.clave === clave);
  await esperar();
  if (!cuenta) throw new Error("CREDENCIALES_INVALIDAS");
  return sinClave(cuenta);
}

// Personal del INE: ve todas las solicitudes.
export async function listarSolicitudesPersonal() {
  return esperar(SOLICITUDES.map(copiar));
}

function copiar(s) {
  return { ...s, invitados: s.invitados.map((i) => ({ ...i })) };
}

function buscar(solicitudId, proveedorId) {
  const s = SOLICITUDES.find((x) => x.id === solicitudId);
  const i = s?.invitados.find((x) => x.proveedorId === proveedorId);
  if (!s || !i) throw new Error("NO_ENCONTRADA");
  return { s, i };
}

// Las tres funciones siguientes cambian los datos de ejemplo en memoria (se reinician al recargar).
export async function asignarSolicitud(solicitudId, nombre) {
  const s = SOLICITUDES.find((x) => x.id === solicitudId);
  if (!s) throw new Error("NO_ENCONTRADA");
  if (!s.asignadoA) s.asignadoA = nombre;
  return esperar(copiar(s));
}

export async function enviarCotizacion({ solicitudId, proveedorId, precio, plazoDias }) {
  const { s, i } = buscar(solicitudId, proveedorId);
  i.paso = 1;
  i.accion = null;
  i.oferta = { precio, plazoDias };
  i.fechas = { ...i.fechas, 1: fechaHoyIso() };
  if (s.invitados.every((x) => x.paso >= 1)) s.estado = "revision";
  return esperar(true);
}

export async function confirmarPrecio({ solicitudId, proveedorId }) {
  const { s, i } = buscar(solicitudId, proveedorId);
  i.paso = 3;
  i.accion = null;
  i.fechas = { ...i.fechas, 3: fechaHoyIso() };
  if (s.invitados.every((x) => x.paso === 3)) s.estado = "cerrada";
  return esperar(true);
}

// Proveedor: solo las solicitudes a las que fue invitado, sin datos de la institución
// ni de los demás proveedores.
export async function listarSolicitudesProveedor(proveedorId) {
  const propias = SOLICITUDES.flatMap((s) => {
    const mia = s.invitados.find((i) => i.proveedorId === proveedorId);
    if (!mia) return [];
    return [
      {
        id: s.id,
        numero: s.numero,
        titulo: s.titulo,
        modalidad: s.modalidad,
        fecha: s.fecha,
        limite: s.limite,
        paso: mia.paso,
        accion: mia.accion,
        propuesta: mia.propuesta ?? null,
        oferta: mia.oferta ?? null,
        historial: Array.from({ length: mia.paso + 1 }, (_, i) => ({
          paso: i,
          fecha: mia.fechas?.[i] ?? sumarDias(s.fecha, DIAS_ENTRE_PASOS[i]),
        })),
      },
    ];
  });
  return esperar(propias);
}
