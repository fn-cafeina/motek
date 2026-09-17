import { Link } from "react-router"
import { buttonClassName } from "./buttonStyles"

export function NotFound({ embedded }: { embedded?: boolean }) {
  // Fuera del shell esta página es el contenido principal; embebida ya vive dentro
  // del <main> del Layout, y anidar dos landmarks es peor que no tener ninguno.
  const Wrapper = embedded ? "div" : "main"
  return (
    <Wrapper
      className={`flex flex-col items-center justify-center gap-3 p-8 text-center ${
        embedded ? "" : "min-h-dvh bg-canvas"
      }`}
    >
      <p className="text-[15px] font-semibold text-fg">Página no encontrada</p>
      <p className="text-[13px] text-muted">La ruta no existe o cambió de lugar.</p>
      <Link to="/" className={buttonClassName("primary")}>
        Volver al inicio
      </Link>
    </Wrapper>
  )
}
