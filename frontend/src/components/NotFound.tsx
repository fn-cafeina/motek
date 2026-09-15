import { Link } from "react-router"
import { buttonClassName } from "./buttonStyles"

export function NotFound({ embedded }: { embedded?: boolean }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 p-8 text-center ${
        embedded ? "" : "min-h-dvh bg-canvas"
      }`}
    >
      <p className="text-[15px] font-semibold text-fg">Página no encontrada</p>
      <p className="text-[13px] text-muted">La ruta no existe o cambió de lugar.</p>
      <Link to="/" className={buttonClassName("primary")}>
        Volver al inicio
      </Link>
    </div>
  )
}
