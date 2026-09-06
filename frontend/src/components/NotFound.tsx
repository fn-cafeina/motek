import { Link } from "react-router"
import { buttonClassName } from "./buttonStyles"

export function NotFound({ embedded }: { embedded?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 p-8 text-center ${embedded ? "" : "min-h-screen bg-zinc-950"}`}>
      <p className="text-sm font-semibold text-zinc-100">Página no encontrada</p>
      <p className="text-xs text-zinc-400">La ruta no existe.</p>
      <Link to="/" className={buttonClassName("primary")}>
        Volver al inicio
      </Link>
    </div>
  )
}
