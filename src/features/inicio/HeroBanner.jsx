import { Link } from "react-router-dom";
import bannerDesktop from "../../assets/banner-desktop.jpg";
import bannerMovil from "../../assets/banner-movil.jpg";

export function HeroBanner() {
  return (
    <section className="hero" id="inicio">
      <Link className="hero__banner" to="/lista">
        <picture>
          <source media="(max-width: 760px)" srcSet={bannerMovil} />
          <img
            src={bannerDesktop}
            alt="DPIR, Dirección de Precios e Índices de Referencia. Conoce los precios actuales en el mercado."
          />
        </picture>
      </Link>
    </section>
  );
}
