import logoIne from "../../assets/logo-ine.png";
import { Contenedor } from "../ui/Contenedor";

export function Pie() {
  return (
    <footer className="pie">
      <Contenedor className="pie__grid">
        <div>
          <img className="pie__logo" src={logoIne} alt="" />
          <p>
            Dirección de Precios e Índices de Referencia. Investigación de mercado, análisis estadístico e informes
            técnicos para las compras del Estado.
          </p>
        </div>
        <div>
          <p className="pie__tit">Publicación</p>
          <a href="https://www.ine.gob.gt/" target="_blank" rel="noopener noreferrer">
            www.ine.gob.gt
          </a>
          <a href="https://www.guatecompras.gt/info/preciosDeReferencia.aspx" target="_blank" rel="noopener noreferrer">
            GUATECOMPRAS · precios de referencia
          </a>
        </div>
        <div>
          <p className="pie__tit">Contacto</p>
          <p>
            Avenida La Reforma 4-22, zona 9
            <br />
            Ciudad de Guatemala
          </p>
          <p>+502 2315-4700 · info@ine.gob.gt</p>
        </div>
      </Contenedor>
      <p className="pie__copy">Instituto Nacional de Estadística · Maqueta de bienvenida DPIR</p>
    </footer>
  );
}
