export function Contenedor({ className = "", children, ...props }) {
  return (
    <div className={["contenedor", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </div>
  );
}
