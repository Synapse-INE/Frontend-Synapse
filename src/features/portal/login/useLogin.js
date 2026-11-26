import { useCallback, useEffect, useRef, useState } from "react";

const REGLAS = {
  correo: (valor) => {
    if (!valor.trim()) return "Escribe tu correo electrónico.";
    return /^\S+@\S+\.\S+$/.test(valor.trim()) ? "" : "Revisa el formato: nombre@correo.com";
  },
  clave: (valor) => (valor ? "" : "Escribe tu contraseña."),
};
const CAMPOS = Object.keys(REGLAS);
const ESPERA_ANTES_DE_SALIR_MS = 750; // deja ver la animación de éxito

// Estado y reglas del formulario de ingreso. No sabe nada de cómo se ve.
export function useLogin({ entrar, alExito, enfocar, alFallar }) {
  const [valores, setValores] = useState({ correo: "", clave: "", recordar: false });
  const [tocados, setTocados] = useState({});
  const [estado, setEstado] = useState("reposo");
  const [mensaje, setMensaje] = useState("");
  const [fallos, setFallos] = useState(0);
  const temporizador = useRef(null);
  const entrando = useRef(false); // evita redirigir antes de terminar la animación de éxito

  useEffect(() => () => clearTimeout(temporizador.current), []);

  const errores = Object.fromEntries(CAMPOS.map((c) => [c, tocados[c] ? REGLAS[c](valores[c]) : ""]));

  const validos = { correo: !!tocados.correo && !!valores.correo.trim() && !REGLAS.correo(valores.correo) };

  const cambiar = useCallback((campo, valor) => {
    setValores((previos) => ({ ...previos, [campo]: valor }));
    setMensaje("");
  }, []);

  const tocar = useCallback((campo) => setTocados((previos) => ({ ...previos, [campo]: true })), []);

  async function enviar(evento) {
    evento.preventDefault();
    setTocados({ correo: true, clave: true });
    const invalido = CAMPOS.find((c) => REGLAS[c](valores[c]));
    if (invalido) {
      enfocar?.(invalido);
      alFallar?.();
      return;
    }

    setMensaje("");
    setEstado("cargando");
    entrando.current = true;
    try {
      const datos = await entrar(valores);
      setEstado("exito");
      temporizador.current = setTimeout(() => alExito(datos), ESPERA_ANTES_DE_SALIR_MS);
    } catch {
      entrando.current = false;
      setEstado("reposo");
      setFallos((n) => n + 1);
      setMensaje("El correo o la contraseña no coinciden. Revisa tus datos e intenta de nuevo.");
      alFallar?.();
    }
  }

  return { valores, errores, validos, estado, mensaje, fallos, entrando, cambiar, tocar, enviar };
}
