import { useEffect, useRef, type RefObject } from "react"

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const FIELDS = 'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])'

// Pila de overlays abiertos. Solo el último responde a Escape y atrapa el tabulador,
// así un diálogo abierto encima de un panel lateral no cierra también el panel.
const openStack: symbol[] = []

export type InitialFocus = "panel" | "first-field"

/**
 * Comportamiento compartido por Dialog y Drawer: foco inicial, trampa de tabulación,
 * cierre con Escape, bloqueo del scroll de fondo y devolución del foco al disparador.
 */
export function useOverlayBehavior({
  open,
  onClose,
  dismissible = true,
  panelRef,
  initialFocus = "first-field",
}: {
  open: boolean
  onClose: () => void
  dismissible?: boolean
  panelRef: RefObject<HTMLElement | null>
  initialFocus?: InitialFocus
}) {
  const restoreRef = useRef<HTMLElement | null>(null)
  const tokenRef = useRef<symbol | null>(null)

  useEffect(() => {
    if (!open) return
    const token = Symbol("overlay")
    tokenRef.current = token
    openStack.push(token)

    // El overlay se monta en `body`, fuera de `#root`, así que marcar `#root` inerte
    // no lo alcanza. `aria-modal` solo no basta: sin esto, el cursor virtual de un
    // lector de pantalla sigue recorriendo la app por detrás del diálogo.
    const root = document.getElementById("root")
    const locksBackground = openStack.length === 1
    if (locksBackground && root) root.inert = true

    // Un formulario arranca en su primer campo; un panel de lectura enfoca el panel,
    // para no saltar a un campo que puede estar fuera de vista al final del contenido.
    const panel = panelRef.current
    const field = initialFocus === "first-field" ? panel?.querySelector<HTMLElement>(FIELDS) : null
    const target = field ?? panel

    restoreRef.current = document.activeElement as HTMLElement | null
    target?.focus({ preventScroll: true })

    return () => {
      const index = openStack.indexOf(token)
      if (index >= 0) openStack.splice(index, 1)
      tokenRef.current = null
      // Se libera antes de devolver el foco: nada dentro de un árbol inerte lo recibe.
      if (locksBackground && root) root.inert = false
      restoreRef.current?.focus()
    }
  }, [open, panelRef, initialFocus])

  useEffect(() => {
    if (!open) return
    const locksScroll = openStack.length === 1

    function onKeyDown(event: KeyboardEvent) {
      const token = tokenRef.current
      const isTopmost = openStack[openStack.length - 1] === token
      if (!isTopmost) return

      if (event.key === "Escape") {
        if (!dismissible) return
        event.stopPropagation()
        onClose()
        return
      }

      if (event.key !== "Tab") return
      const panel = panelRef.current
      if (!panel) return
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null,
      )
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    const previousOverflow = document.body.style.overflow
    if (locksScroll) document.body.style.overflow = "hidden"
    document.addEventListener("keydown", onKeyDown)
    return () => {
      if (locksScroll) document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open, onClose, dismissible, panelRef])
}
