import { Link } from "react-router-dom";
import { Contenedor } from "../../components/ui/Contenedor";
import { Etiqueta } from "../../components/ui/Etiqueta";
import { ESTADOS_SOLICITUD, leerSolicitudes } from "../../data/solicitudes";
import { ROLES } from "../../sesion/roles";
import { useSesion } from "../../sesion/Sesion";

export function CuentaPage() {
  const { sesion } = useSesion();
  const rol = ROLES[sesion?.rol] ?? ROLES.solicitante;
  const solicitudes = leerSolicitudes();
  const propias = solicitudes.filter((item) => item.creadaPorId === sesion?.id);
  const aprobada = sesion?.estadoRevision === "aprobado";

  return (
    <section className="pagina bloque">
      <Contenedor>
        <header className="publicacion-encabezado">
          <Etiqueta>{rol.etiqueta}</Etiqueta>
          <h2>{sesion ? sesion.nombre : "Sesión"}</h2>
          <div className="aviso-oficial">
            <p>{rol.resumen}</p>
          </div>
        </header>

        {sesion?.rol === "solicitante" && !aprobada ? (
          <div className="acceso-lista">
            <h3>Cuenta en revisión</h3>
            <p>
              {sesion.institucion || "La institución"} quedó registrada
              {sesion.cargo ? ` con el cargo de ${sesion.cargo}` : ""}. El INE revisa el perfil antes de habilitar las solicitudes.
            </p>
          </div>
        ) : null}

        {sesion?.rol === "solicitante" && aprobada ? (
          <Lista
            titulo="Mis solicitudes"
            filas={propias}
            vacio="Aún no hay solicitudes de esta institución."
            accion={<Link className="btn btn--naranja" to="/solicitud">Nueva solicitud</Link>}
          />
        ) : null}

        {sesion?.rol === "trabajador" ? (
          <Lista
            titulo="Solicitudes recibidas"
            filas={solicitudes}
            vacio="Aún no entra ninguna solicitud."
          />
        ) : null}

        {sesion?.rol === "proveedor" ? (
          <div className="acceso-lista">
            <h3>Catálogo</h3>
            <p>Los productos, el precio vigente y el historial se consultan en la vista del proveedor.</p>
            <Link className="btn btn--naranja" to="/proveedor">Ir a mis productos</Link>
          </div>
        ) : null}

        {sesion?.rol === "admin" ? (
          <div className="acceso-lista">
            <h3>Gestión</h3>
            <p>Las cuentas, las modalidades y la bitácora se trabajan en la vista de administración.</p>
            <Link className="btn btn--naranja" to="/admin">Ir a administración</Link>
          </div>
        ) : null}
      </Contenedor>
    </section>
  );
}

function Lista({ titulo, filas, vacio, accion = null }) {
  return (
    <div className="acceso-lista">
      <h3>{titulo}</h3>
      {filas.length === 0 ? <p>{vacio}</p> : filas.map((item) => (
        <article key={item.id}>
          <strong>{item.titulo}</strong>
          <span>{ESTADOS_SOLICITUD[item.estado] || item.estado}</span>
          <small>{item.institucionSolicitante} · {item.productos?.length || 0} producto{item.productos?.length === 1 ? "" : "s"}</small>
        </article>
      ))}
      {accion}
    </div>
  );
}
