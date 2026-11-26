import { CUENTAS } from "../datos";

// SOLO PARA LA DEMO: atajo para llenar las cuentas de prueba. Borrar al conectar el servidor.
export function CuentasDemo({ alElegir }) {
  return (
    <div className="lg-demo">
      <span>Cuentas de prueba:</span>
      {CUENTAS.map((cuenta) => (
        <button key={cuenta.correo} type="button" onClick={() => alElegir(cuenta)}>
          {cuenta.rol === "personal" ? "Personal del INE" : "Proveedor"}
        </button>
      ))}
    </div>
  );
}
