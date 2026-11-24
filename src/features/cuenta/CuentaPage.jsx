import { Link } from "react-router-dom";
import { Contenedor } from "../../components/ui/Contenedor";
import { Etiqueta } from "../../components/ui/Etiqueta";
import { ROLES } from "../../sesion/roles";
import { useSesion } from "../../sesion/Sesion";

const SOLICITUDES = [
  { titulo: "500 computadoras portátiles", estado: "En revisión", fecha: "12/11/2026" },
  { titulo: "Papel bond tamaño carta", estado: "Recibida", fecha: "20/11/2026" },
];

export function CuentaPage() {
  const { sesion } = useSesion();
  const rol = ROLES[sesion?.rol] ?? ROLES.externo;

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

        {sesion?.rol === "trabajador" ? (
          <div className="acceso-lista">
            <h3>Solicitudes</h3>
            {SOLICITUDES.map((item) => (
              <article key={item.titulo}>
                <strong>{item.titulo}</strong>
                <span>{item.estado}</span>
                <small>{item.fecha}</small>
              </article>
            ))}
            <Link className="btn btn--naranja" to="/solicitud">Nueva solicitud</Link>
          </div>
        ) : null}

        {sesion?.rol === "jefe" ? (
          <div className="acceso-lista">
            <h3>Bandeja de revisión</h3>
            {SOLICITUDES.map((item) => (
              <article key={item.titulo}>
                <strong>{item.titulo}</strong>
                <span>{item.estado}</span>
                <small>Trabajador · {item.fecha}</small>
              </article>
            ))}
          </div>
        ) : null}

        {sesion?.rol === "proveedor" ? (
          <div className="acceso-lista">
            <h3>Catálogo</h3>
            <p>Los productos, el precio vigente y el historial se consultan en la vista del proveedor.</p>
            <Link className="btn btn--naranja" to="/proveedor">Ir a mis productos</Link>
          </div>
        ) : null}

        {sesion?.rol === "externo" ? (
          <div className="acceso-lista">
            <h3>Cuenta registrada</h3>
            <p>El acceso se habilita desde la gestión del portal. Mientras tanto, la cuenta queda guardada con estos datos.</p>
          </div>
        ) : null}

        {sesion?.rol === "admin" ? (
          <div className="acceso-lista">
            <h3>Gestión</h3>
            <p>Las cuentas, las categorías y la bitácora se trabajan en la vista de administración.</p>
            <Link className="btn btn--naranja" to="/admin">Ir a administración</Link>
          </div>
        ) : null}

        {!sesion ? (
          <p>
            <Link className="btn btn--azul" to="/ingresar">Ingresar</Link>
          </p>
        ) : null}
      </Contenedor>
    </section>
  );
}
