import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Boton } from "../../components/ui/Boton";
import { Contenedor } from "../../components/ui/Contenedor";
import { Etiqueta } from "../../components/ui/Etiqueta";

export function ConsultaRapida() {
  const [consulta, setConsulta] = useState("");
  const navigate = useNavigate();

  function buscar(evento) {
    evento.preventDefault();
    const q = consulta.trim();
    navigate(q ? `/lista?q=${encodeURIComponent(q)}` : "/lista");
  }

  return (
    <section className="buscar revelar" aria-labelledby="titulo-buscar">
      <Contenedor className="buscar__caja">
        <div className="buscar__texto">
          <Etiqueta>Consulta rápida</Etiqueta>
          <h2 id="titulo-buscar">¿Qué precio necesitas verificar?</h2>
          <p>
            Busca por bien o servicio. La lista cubre contrato abierto, subasta electrónica inversa y bienes
            importados.
          </p>
        </div>
        <form className="buscador" role="search" onSubmit={buscar}>
          <label className="sr-only" htmlFor="q">
            Buscar bien o servicio
          </label>
          <svg className="buscador__lupa" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3.5-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            id="q"
            name="q"
            type="search"
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            placeholder="Ej. computadora portátil, cementos, medicamentos…"
          />
          <Boton type="submit" variante="azul">
            Consultar
          </Boton>
        </form>
      </Contenedor>
    </section>
  );
}
