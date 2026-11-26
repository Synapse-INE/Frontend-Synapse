import fotoIne from "../../assets/acceso-ine.jpg";

export function AccesoMarco({ titulo, texto, children }) {
  return (
    <section className="acceso">
      <aside className="acceso__lado">
        <img className="acceso__foto" src={fotoIne} alt="" />
        <div>
          <i />
          <h2>{titulo}</h2>
          <p>{texto}</p>
        </div>
      </aside>
      <div className="acceso__panel">
        <div className="acceso__caja">{children}</div>
      </div>
    </section>
  );
}
