import { useEffect, useState } from "react";
import { formatearFecha } from "../data/precios";

const BASE = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");
const CIRCUNFERENCIA = 2 * Math.PI * 72;
const CLASES = ["sw-azul", "sw-naranja", "sw-lima"];
const VACIO = {
  total: 0,
  vigentes: 0,
  ultimaPublicacion: null,
  modalidadPrincipal: null,
  modalidades: [],
  categorias: [],
  meses: [],
  puntos: [],
  mesActual: "—",
  tendencia: "—",
  recientes: [],
  indicadores: [],
  metodos: [],
  cargando: true,
  error: "",
};

export function useResumenPublicacion() {
  const [estado, setEstado] = useState(VACIO);

  useEffect(() => {
    let vigente = true;
    fetch(`${BASE}/api/v1/publicacion/resumen`, { headers: { Accept: "application/json" } })
      .then(async (respuesta) => {
        if (!respuesta.ok) throw new Error("respuesta");
        return respuesta.json();
      })
      .then((datos) => {
        if (vigente) setEstado({ ...presentar(datos), cargando: false, error: "" });
      })
      .catch(() => {
        if (vigente) setEstado({ ...VACIO, cargando: false, error: "No se pudo leer la publicación." });
      });
    return () => {
      vigente = false;
    };
  }, []);

  return estado;
}

function presentar(datos) {
  const total = Number(datos.total) || 0;
  const modalidades = Array.isArray(datos.modalidades) ? datos.modalidades : [];
  const suma = modalidades.reduce((acumulado, fila) => acumulado + Number(fila.n || 0), 0) || 1;
  const visibles = modalidades.filter((fila) => Number(fila.n) > 0);
  const hueco = 6;
  const piso = 16;
  const presupuesto = CIRCUNFERENCIA - visibles.length * hueco;
  const largos = visibles.map((fila) => (Number(fila.n) / suma) * presupuesto);
  const exceso = largos.reduce((acumulado, largo) => acumulado + Math.max(0, piso - largo), 0);
  const mayor = largos.reduce((indice, largo, actual) => (largo > largos[indice] ? actual : indice), 0);
  const ajustados = largos.map((largo, indice) => {
    const conPiso = Math.max(largo, piso);
    return indice === mayor ? conPiso - exceso : conPiso;
  });
  let offset = 0;
  const metodos = visibles.map((fila, indice) => {
    const largo = ajustados[indice];
    const metodo = {
      clave: fila.etiqueta,
      etiqueta: fila.etiqueta,
      corto: acortar(fila.etiqueta, 22),
      n: fila.n,
      porcentaje: fila.porcentaje,
      clase: CLASES[indice % CLASES.length],
      largo,
      offset,
      circunferencia: CIRCUNFERENCIA,
    };
    offset += largo + hueco;
    return metodo;
  });

  const meses = Array.isArray(datos.meses) ? datos.meses : [];
  const maxMes = Math.max(1, ...meses.map((mes) => Number(mes.n) || 0));
  const puntos = meses.map((mes, indice) => {
    const ultimo = Math.max(meses.length - 1, 1);
    return {
      mes: mes.etiqueta,
      n: mes.n,
      x: 28 + (indice * 340) / ultimo,
      y: 168 - ((Number(mes.n) || 0) / maxMes) * 132,
    };
  });
  const mesActual = meses.at(-1);

  const vigentes = Number(datos.vigentes) || 0;
  const principal = datos.modalidadPrincipal;

  return {
    ...datos,
    metodos,
    puntos,
    mesActual: mesActual?.etiqueta ?? "—",
    indicadores: [
      { id: "renglones", etiqueta: "Renglones publicados", valor: total.toLocaleString("es-GT"), barra: total ? 100 : 0 },
      { id: "vigentes", etiqueta: "Siguen vigentes", valor: vigentes.toLocaleString("es-GT"), barra: total ? Math.round((vigentes / total) * 100) : 0 },
      { id: "ultima", etiqueta: "Última publicación", valor: formatearFecha(datos.ultimaPublicacion), barra: datos.ultimaPublicacion ? 100 : 0 },
      { id: "modalidad", etiqueta: "Modalidad más usada", valor: principal ? `${principal.etiqueta} · ${principal.porcentaje}%` : "—", barra: principal?.porcentaje ?? 0 },
    ],
  };
}

function acortar(texto, max) {
  const valor = String(texto ?? "").trim();
  return valor.length > max ? `${valor.slice(0, max - 1)}…` : valor;
}
